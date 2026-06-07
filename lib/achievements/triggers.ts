/**
 * O2 PRODE — Achievement Trigger Engine
 * Agente 11 · Gamification
 *
 * Pure evaluators per achievement. Given a TriggerContext, each returns
 * boolean indicating whether the achievement should be unlocked.
 *
 * Engine is idempotent: it must not unlock the same achievement twice.
 * The action layer (`actions.ts`) handles the persistence + dedup.
 */

import { ACHIEVEMENTS, ACHIEVEMENT_BY_TRIGGER, type AchievementDef } from "./catalog";

// ─── Context ─────────────────────────────────────────────────────────

export interface GroupCompletionSummary {
  groupId: string;
  predictedCount: number;
  winnersCorrect: number;
  exactsCorrect: number;
}

export interface KnockoutRoundSummary {
  phase: "round-of-32" | "round-of-16" | "quarter" | "semi" | "final";
  totalMatches: number;
  winnersCorrect: number;
}

export interface UpsetSummary {
  /** count of matches where user predicted non-favorite and that team won */
  upsetsCorrect: number;
}

export interface TriggerContext {
  userId: string;
  /** exact-result streaks in chronological order */
  exactStreak: number;
  /** consecutive days the user has loaded predictions */
  streakDays: number;
  /** % of total tournament matches predicted (0-100) */
  tournamentCompletionPercent: number;
  /** did user load a full group on its first available day? */
  loadedGroupFirstDay: boolean;
  /** groups completion stats */
  groups: GroupCompletionSummary[];
  /** knockout rounds stats */
  knockoutRounds: KnockoutRoundSummary[];
  /** upset count */
  upsets: UpsetSummary;
  /** current position in global ranking */
  position: number;
  /** delta in position over the past week (positive = subió) */
  weeklyPositionDelta: number;
  /** post / comment / share counts */
  postsCount: number;
  bestPostReactions: number;
  commentsMadeOnDistinctPostsCount: number;
  externalSharesCount: number;
  activatedFriendsCount: number;
  /** special prediction */
  predictedChampionCode: string | null;
  actualChampionCode: string | null;
  /** subcampeón (finalista perdedor). Opcionales: solo el scope match-settled
   *  los computa; los demás scopes los dejan undefined (= no se evalúan). */
  predictedRunnerUpCode?: string | null;
  actualRunnerUpCode?: string | null;
  /** tournament state */
  tournamentEnded: boolean;
  tournamentWinnerUserId: string | null;
}

type Evaluator = (ctx: TriggerContext) => boolean;

// ─── Evaluators ──────────────────────────────────────────────────────

const evaluators: Record<string, Evaluator> = {
  // Skill
  streak_exact_5: (c) => c.exactStreak >= 5,
  champion_correct: (c) =>
    c.actualChampionCode !== null && c.predictedChampionCode === c.actualChampionCode,
  runner_up_correct: (c) =>
    !!c.actualRunnerUpCode && c.predictedRunnerUpCode === c.actualRunnerUpCode,
  finalists_correct: (c) => {
    if (!c.actualChampionCode || !c.actualRunnerUpCode) return false;
    if (!c.predictedChampionCode || !c.predictedRunnerUpCode) return false;
    // Acertar a los 2 finalistas sin importar quién ganó (set de equipos).
    const predicted = new Set([c.predictedChampionCode, c.predictedRunnerUpCode]);
    return predicted.has(c.actualChampionCode) && predicted.has(c.actualRunnerUpCode);
  },
  upset_correct: (c) => c.upsets.upsetsCorrect >= 1,
  group_complete_correct: (c) =>
    c.groups.some((g) => g.predictedCount === 6 && g.winnersCorrect === 6),
  knockout_round_correct: (c) =>
    c.knockoutRounds.some((r) => r.totalMatches > 0 && r.winnersCorrect === r.totalMatches),

  // Consistency
  streak_days_7: (c) => c.streakDays >= 7,
  streak_days_21: (c) => c.streakDays >= 21,
  tournament_100: (c) => c.tournamentCompletionPercent >= 100,
  group_first_day: (c) => c.loadedGroupFirstDay,

  // Social
  first_post: (c) => c.postsCount >= 1,
  post_10_reactions: (c) => c.bestPostReactions >= 10,
  external_shares_5: (c) => c.externalSharesCount >= 5,
  comments_made_10: (c) => c.commentsMadeOnDistinctPostsCount >= 10,
  friends_active_3: (c) => c.activatedFriendsCount >= 3,

  // Position
  position_top_10: (c) => c.position > 0 && c.position <= 10,
  position_top_3: (c) => c.position > 0 && c.position <= 3,
  position_1: (c) => c.position === 1,
  weekly_rise_10: (c) => c.weeklyPositionDelta >= 10,
  // P05 "tournament_winner" eliminado: no se premia con puntos al #1 del ranking.
};

// ─── Public API ──────────────────────────────────────────────────────

export interface EvaluationResult {
  achievement: AchievementDef;
  unlocked: boolean;
}

/**
 * Evaluates every achievement against the given context.
 * Returns all (unlocked = true) results.
 * Does NOT persist anything — the action layer handles that.
 */
export function evaluateAchievements(
  ctx: TriggerContext,
  alreadyUnlockedIds: ReadonlySet<string> = new Set()
): EvaluationResult[] {
  const results: EvaluationResult[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (alreadyUnlockedIds.has(ach.id)) continue;
    const evaluator = evaluators[ach.triggerKey];
    if (!evaluator) continue;
    if (evaluator(ctx)) {
      results.push({ achievement: ach, unlocked: true });
    }
  }
  return results;
}

/**
 * Evaluates a subset of achievements relevant to a given event type.
 * Cheaper than full evaluation when we know the trigger source.
 */
export type EventScope = "match-settled" | "position" | "social" | "daily-cron" | "weekly-cron";

export const scopeMap: Record<EventScope, readonly string[]> = {
  // Logros que dependen SOLO de las predicciones del socio en el partido que
  // acaba de cerrar. Se evalúan por-predictor. La POSICIÓN NO va acá: depende del
  // ranking global (se reordena para ~todos, no solo predictores) → scope aparte.
  "match-settled": [
    "streak_exact_5",
    "upset_correct",
    "group_complete_correct",
    "knockout_round_correct",
    "tournament_100",
    "champion_correct",
    "runner_up_correct",
    "finalists_correct",
  ],
  // Logros de posición: dependen del ranking GLOBAL. Tras un settle/resettle las
  // posiciones se reordenan para todos los socios, así que se reconcilian
  // ranking-wide (ver lib/achievements/position-reconcile.ts), NO por-predictor.
  position: ["position_top_10", "position_top_3", "position_1"],
  social: [
    "first_post",
    "post_10_reactions",
    "external_shares_5",
    "comments_made_10",
    "friends_active_3",
  ],
  "daily-cron": ["streak_days_7", "streak_days_21", "group_first_day"],
  "weekly-cron": ["weekly_rise_10"],
};

export function evaluateForEvent(
  scope: EventScope,
  ctx: TriggerContext,
  alreadyUnlockedIds: ReadonlySet<string> = new Set()
): EvaluationResult[] {
  const triggers = scopeMap[scope];
  const results: EvaluationResult[] = [];
  for (const triggerKey of triggers) {
    const ach = ACHIEVEMENT_BY_TRIGGER.get(triggerKey);
    if (!ach) continue;
    if (alreadyUnlockedIds.has(ach.id)) continue;
    const evaluator = evaluators[triggerKey];
    if (!evaluator) continue;
    if (evaluator(ctx)) {
      results.push({ achievement: ach, unlocked: true });
    }
  }
  return results;
}

// ─── Posición (ranking-wide) ─────────────────────────────────────────

/** Contexto base con todas las condiciones en falso/cero (sin desbloquear nada). */
const ZERO_CONTEXT: TriggerContext = {
  userId: "",
  exactStreak: 0,
  streakDays: 0,
  tournamentCompletionPercent: 0,
  loadedGroupFirstDay: false,
  groups: [],
  knockoutRounds: [],
  upsets: { upsetsCorrect: 0 },
  position: 0,
  weeklyPositionDelta: 0,
  postsCount: 0,
  bestPostReactions: 0,
  commentsMadeOnDistinctPostsCount: 0,
  externalSharesCount: 0,
  activatedFriendsCount: 0,
  predictedChampionCode: null,
  actualChampionCode: null,
  predictedRunnerUpCode: null,
  actualRunnerUpCode: null,
  tournamentEnded: false,
  tournamentWinnerUserId: null,
};

/** Achievement IDs del scope "position" (P01-P03), derivados del catálogo. */
export const POSITION_ACHIEVEMENT_IDS: readonly string[] = scopeMap.position
  .map((k) => ACHIEVEMENT_BY_TRIGGER.get(k)?.id)
  .filter((id): id is string => Boolean(id));

/**
 * IDs de logros de posición que un socio MERECE en una posición dada del ranking
 * global. Source of truth de los umbrales: reusa los mismos evaluadores que el
 * resto del engine (no duplica thresholds). `position` 0 = sin ranking → ninguno.
 *
 * La reconciliación ranking-wide (position-reconcile.ts) compara este conjunto
 * "merecido" contra lo que el socio ya tiene para otorgar/revocar P01-P03 a TODOS
 * los socios cuya posición cambió, no solo a los que predijeron el último partido.
 */
export function positionAchievementIdsFor(position: number): string[] {
  // Contexto completo (todos los demás campos en cero) para no castear: los
  // evaluadores de posición solo leen `position`, pero pasamos un TriggerContext
  // válido para mantener el type-safety si alguno pasa a leer otro campo.
  return evaluateForEvent("position", { ...ZERO_CONTEXT, position }).map(
    (r) => r.achievement.id
  );
}
