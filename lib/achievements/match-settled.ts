/**
 * O2 PRODE — Evaluación de logros tras el cierre de partidos (scope match-settled).
 *
 * El scoring lo hace el trigger de Postgres (fn_settle_match) al marcar el match
 * 'finished'. Pero los logros de SKILL (A01-A05) y de POSICIÓN (P01-P03/P05) viven
 * en el scope "match-settled" y necesitan un evaluador en runtime: este módulo.
 * Lo llama el cron sync-results tras cerrar partidos, para cada socio afectado.
 *
 * Pre-fetch de datos compartidos (matches/results/etc.) UNA sola vez y cómputo
 * por-usuario en memoria, para no disparar N queries por socio.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { processAchievements } from "./actions";
import { ACHIEVEMENT_BY_TRIGGER } from "./catalog";
import {
  scopeMap,
  type TriggerContext,
  type GroupCompletionSummary,
  type KnockoutRoundSummary,
} from "./triggers";

/**
 * Revierte los logros de scope "match-settled" de un set de socios y descuenta su
 * bonus de total_points. Se usa al CORREGIR un resultado finalizado: el logro
 * otorgado con el resultado viejo (p.ej. "acierto exacto") puede ya no ser válido.
 * Tras revertir se llama evaluateMatchSettledForUsers, que re-otorga los que SIGUEN
 * válidos (neto 0) y deja fuera los que no.
 */
export async function revertMatchSettledAchievements(userIds: string[]): Promise<void> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return;

  const achIds = scopeMap["match-settled"]
    .map((k) => ACHIEVEMENT_BY_TRIGGER.get(k)?.id)
    .filter((x): x is string => Boolean(x));
  if (achIds.length === 0) return;

  const admin = createAdminClient();

  // Bonus efectivo desde el catálogo (admin-editable).
  const { data: cat } = await admin
    .from("achievement_catalog")
    .select("id, points_bonus")
    .in("id", achIds);
  const bonusById = new Map(
    (cat ?? []).map((c) => [c.id as string, (c.points_bonus as number) ?? 0])
  );

  const { data: rows } = await admin
    .from("user_achievement")
    .select("user_id, achievement_id")
    .in("user_id", ids)
    .in("achievement_id", achIds);
  if (!rows?.length) return;

  const revertByUser = new Map<string, number>();
  for (const r of rows) {
    const uid = r.user_id as string;
    revertByUser.set(
      uid,
      (revertByUser.get(uid) ?? 0) + (bonusById.get(r.achievement_id as string) ?? 0)
    );
  }

  await admin.from("user_achievement").delete().in("user_id", ids).in("achievement_id", achIds);

  for (const [uid, total] of revertByUser) {
    if (total > 0) await admin.rpc("fn_add_points", { p_user_id: uid, p_delta: -total });
  }
}

type Pred = { user_id: string; match_id: string; home_score: number; away_score: number };
type MatchRow = {
  id: string;
  phase: string;
  group_id: string | null;
  home_code: string;
  away_code: string;
  kickoff_at: string;
  status: string;
};
type ResultRow = { match_id: string; home_score: number; away_score: number };

const outcome = (h: number, a: number) => (h > a ? "h" : h < a ? "a" : "d");

/** Evalúa los logros match-settled para una lista de socios (deduplicada). */
export async function evaluateMatchSettledForUsers(userIds: string[]): Promise<void> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return;

  const admin = createAdminClient();

  const [matchesRes, resultsRes, specialsRes, usersRes, predsRes] = await Promise.all([
    admin.from("match").select("id, phase, group_id, home_code, away_code, kickoff_at, status"),
    admin.from("match_result").select("match_id, home_score, away_score"),
    admin.from("special_prediction").select("user_id, champion_code, runner_up_code").in("user_id", ids),
    admin.from("user").select("id, position").in("id", ids),
    admin.from("prediction").select("user_id, match_id, home_score, away_score").in("user_id", ids),
  ]);

  const matches = (matchesRes.data ?? []) as MatchRow[];
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const resultByMatch = new Map((resultsRes.data ?? []).map((r) => [(r as ResultRow).match_id, r as ResultRow]));
  type SpecialRow = { user_id: string; champion_code: string | null; runner_up_code: string | null };
  const championByUser = new Map(
    (specialsRes.data ?? []).map((s) => [(s as SpecialRow).user_id, (s as SpecialRow).champion_code])
  );
  const runnerUpByUser = new Map(
    (specialsRes.data ?? []).map((s) => [(s as SpecialRow).user_id, (s as SpecialRow).runner_up_code])
  );
  const positionByUser = new Map((usersRes.data ?? []).map((u) => [(u as { id: string; position: number }).id, (u as { position: number }).position]));

  const predsByUser = new Map<string, Pred[]>();
  for (const p of (predsRes.data ?? []) as Pred[]) {
    const arr = predsByUser.get(p.user_id) ?? [];
    arr.push(p);
    predsByUser.set(p.user_id, arr);
  }

  // Estado de torneo (compartido entre todos los socios)
  const finalMatch = matches.find((m) => m.phase === "final");
  const tournamentEnded = !!finalMatch && finalMatch.status === "finished";
  let actualChampionCode: string | null = null;
  let actualRunnerUpCode: string | null = null;
  let tournamentWinnerUserId: string | null = null;
  if (tournamentEnded && finalMatch) {
    const fr = resultByMatch.get(finalMatch.id);
    if (fr) {
      const homeWon = fr.home_score > fr.away_score;
      actualChampionCode = homeWon ? finalMatch.home_code : finalMatch.away_code;
      actualRunnerUpCode = homeWon ? finalMatch.away_code : finalMatch.home_code;
    }
    const { data: leader } = await admin
      .from("user")
      .select("id")
      .is("deleted_at", null)
      .order("total_points", { ascending: false })
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    tournamentWinnerUserId = (leader?.id as string) ?? null;
  }

  const totalMatches = matches.length;

  for (const userId of ids) {
    try {
      const ctx = buildContext({
        userId,
        preds: predsByUser.get(userId) ?? [],
        matchById,
        resultByMatch,
        position: positionByUser.get(userId) ?? 0,
        predictedChampionCode: championByUser.get(userId) ?? null,
        actualChampionCode,
        predictedRunnerUpCode: runnerUpByUser.get(userId) ?? null,
        actualRunnerUpCode,
        tournamentEnded,
        tournamentWinnerUserId,
        totalMatches,
      });
      await processAchievements("match-settled", ctx);
    } catch (e) {
      console.error("[match-settled] eval falló para", userId, (e as Error).message);
    }
  }
}

function buildContext(args: {
  userId: string;
  preds: Pred[];
  matchById: Map<string, MatchRow>;
  resultByMatch: Map<string, ResultRow>;
  position: number;
  predictedChampionCode: string | null;
  actualChampionCode: string | null;
  predictedRunnerUpCode: string | null;
  actualRunnerUpCode: string | null;
  tournamentEnded: boolean;
  tournamentWinnerUserId: string | null;
  totalMatches: number;
}): TriggerContext {
  const { preds, matchById, resultByMatch } = args;

  // predicciones de partidos YA finalizados, ordenadas por kickoff
  const settled = preds
    .map((p) => {
      const m = matchById.get(p.match_id);
      const r = resultByMatch.get(p.match_id);
      return m && r ? { p, m, r } : null;
    })
    .filter((x): x is { p: Pred; m: MatchRow; r: ResultRow } => x !== null)
    .sort((a, b) => a.m.kickoff_at.localeCompare(b.m.kickoff_at));

  const isExact = (x: { p: Pred; r: ResultRow }) =>
    x.p.home_score === x.r.home_score && x.p.away_score === x.r.away_score;
  const winnerCorrect = (x: { p: Pred; r: ResultRow }) =>
    outcome(x.p.home_score, x.p.away_score) === outcome(x.r.home_score, x.r.away_score);

  // racha máxima de exactos consecutivos
  let exactStreak = 0;
  let run = 0;
  for (const x of settled) {
    if (isExact(x)) {
      run++;
      exactStreak = Math.max(exactStreak, run);
    } else {
      run = 0;
    }
  }

  // grupos
  const groupAgg = new Map<string, { predictedCount: number; winnersCorrect: number; exactsCorrect: number }>();
  for (const x of settled) {
    if (x.m.phase !== "groups" || !x.m.group_id) continue;
    const g = groupAgg.get(x.m.group_id) ?? { predictedCount: 0, winnersCorrect: 0, exactsCorrect: 0 };
    g.predictedCount++;
    if (winnerCorrect(x)) g.winnersCorrect++;
    if (isExact(x)) g.exactsCorrect++;
    groupAgg.set(x.m.group_id, g);
  }
  const groups: GroupCompletionSummary[] = [...groupAgg.entries()].map(([groupId, v]) => ({ groupId, ...v }));

  // cruces de eliminatorias
  const koAgg = new Map<string, { totalMatches: number; winnersCorrect: number }>();
  for (const x of settled) {
    if (x.m.phase === "groups") continue;
    const k = koAgg.get(x.m.phase) ?? { totalMatches: 0, winnersCorrect: 0 };
    k.totalMatches++;
    if (winnerCorrect(x)) k.winnersCorrect++;
    koAgg.set(x.m.phase, k);
  }
  const knockoutRounds: KnockoutRoundSummary[] = [...koAgg.entries()].map(([phase, v]) => ({
    phase: phase as KnockoutRoundSummary["phase"],
    ...v,
  }));

  const tournamentCompletionPercent =
    args.totalMatches > 0 ? (preds.length / args.totalMatches) * 100 : 0;

  return {
    userId: args.userId,
    exactStreak,
    streakDays: 0,
    tournamentCompletionPercent,
    loadedGroupFirstDay: false,
    groups,
    knockoutRounds,
    upsets: { upsetsCorrect: 0 }, // sin datos de favorito (odds) A03 no se computa
    position: args.position,
    weeklyPositionDelta: 0,
    postsCount: 0,
    bestPostReactions: 0,
    commentsMadeOnDistinctPostsCount: 0,
    externalSharesCount: 0,
    activatedFriendsCount: 0,
    predictedChampionCode: args.predictedChampionCode,
    actualChampionCode: args.actualChampionCode,
    predictedRunnerUpCode: args.predictedRunnerUpCode,
    actualRunnerUpCode: args.actualRunnerUpCode,
    tournamentEnded: args.tournamentEnded,
    tournamentWinnerUserId: args.tournamentWinnerUserId,
  };
}
