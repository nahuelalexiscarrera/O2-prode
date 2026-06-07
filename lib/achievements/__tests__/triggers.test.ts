// @vitest-environment node
/**
 * O2 PRODE — Achievement Triggers · Test Suite
 *
 * Covers every evaluator (19 achievements) + evaluateForEvent scope filtering.
 * All tests are pure: no DB, no side effects.
 */

import { describe, it, expect } from "vitest";
import {
  evaluateAchievements,
  evaluateForEvent,
  positionAchievementIdsFor,
  POSITION_ACHIEVEMENT_IDS,
} from "../triggers";
import type { TriggerContext } from "../triggers";

// ─── Helpers ─────────────────────────────────────────────────────────

/** Returns a baseline context where every condition is false / zero. */
function baseCtx(overrides: Partial<TriggerContext> = {}): TriggerContext {
  return {
    userId: "u-test",
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
    tournamentEnded: false,
    tournamentWinnerUserId: null,
    ...overrides,
  };
}

function unlockedIds(ctx: TriggerContext): string[] {
  return evaluateAchievements(ctx).map((r) => r.achievement.id);
}

// ─── Skill achievements ───────────────────────────────────────────────

describe("A01 — streak_exact_5", () => {
  it("no se desbloquea con 4 exactos seguidos", () => {
    expect(unlockedIds(baseCtx({ exactStreak: 4 }))).not.toContain("A01");
  });
  it("se desbloquea con exactamente 5", () => {
    expect(unlockedIds(baseCtx({ exactStreak: 5 }))).toContain("A01");
  });
  it("se desbloquea con más de 5", () => {
    expect(unlockedIds(baseCtx({ exactStreak: 12 }))).toContain("A01");
  });
});

describe("A02 — champion_correct", () => {
  it("no se desbloquea sin campeón real", () => {
    expect(unlockedIds(baseCtx({ predictedChampionCode: "ARG", actualChampionCode: null }))).not.toContain("A02");
  });
  it("no se desbloquea si la predicción difiere", () => {
    expect(unlockedIds(baseCtx({ predictedChampionCode: "ARG", actualChampionCode: "BRA" }))).not.toContain("A02");
  });
  it("se desbloquea si la predicción coincide", () => {
    expect(unlockedIds(baseCtx({ predictedChampionCode: "ARG", actualChampionCode: "ARG" }))).toContain("A02");
  });
});

describe("A03 — upset_correct", () => {
  it("no se desbloquea con 0 upsets", () => {
    expect(unlockedIds(baseCtx())).not.toContain("A03");
  });
  it("se desbloquea con 1 upset", () => {
    expect(unlockedIds(baseCtx({ upsets: { upsetsCorrect: 1 } }))).toContain("A03");
  });
});

describe("A04 — group_complete_correct", () => {
  it("no se desbloquea si ningún grupo tiene 6 winners", () => {
    const ctx = baseCtx({
      groups: [{ groupId: "A", predictedCount: 6, winnersCorrect: 5, exactsCorrect: 0 }],
    });
    expect(unlockedIds(ctx)).not.toContain("A04");
  });
  it("no se desbloquea si predictedCount < 6 aunque winners = 6", () => {
    const ctx = baseCtx({
      groups: [{ groupId: "A", predictedCount: 5, winnersCorrect: 6, exactsCorrect: 0 }],
    });
    expect(unlockedIds(ctx)).not.toContain("A04");
  });
  it("se desbloquea con 6/6 en cualquier grupo", () => {
    const ctx = baseCtx({
      groups: [
        { groupId: "A", predictedCount: 6, winnersCorrect: 4, exactsCorrect: 0 },
        { groupId: "B", predictedCount: 6, winnersCorrect: 6, exactsCorrect: 2 },
      ],
    });
    expect(unlockedIds(ctx)).toContain("A04");
  });
});

describe("A05 — knockout_round_correct", () => {
  it("no se desbloquea si no hay rondas eliminatorias", () => {
    expect(unlockedIds(baseCtx())).not.toContain("A05");
  });
  it("no se desbloquea si quedan cruces sin acertar", () => {
    const ctx = baseCtx({
      knockoutRounds: [{ phase: "round-of-16", totalMatches: 8, winnersCorrect: 7 }],
    });
    expect(unlockedIds(ctx)).not.toContain("A05");
  });
  it("se desbloquea si todos los cruces de alguna ronda son correctos", () => {
    const ctx = baseCtx({
      knockoutRounds: [{ phase: "quarter", totalMatches: 4, winnersCorrect: 4 }],
    });
    expect(unlockedIds(ctx)).toContain("A05");
  });
  it("no se desbloquea si la ronda tiene 0 partidos", () => {
    const ctx = baseCtx({
      knockoutRounds: [{ phase: "final", totalMatches: 0, winnersCorrect: 0 }],
    });
    expect(unlockedIds(ctx)).not.toContain("A05");
  });
});

// ─── Consistency achievements ─────────────────────────────────────────

describe("C01 — streak_days_7", () => {
  it("no se desbloquea con 6 días", () => {
    expect(unlockedIds(baseCtx({ streakDays: 6 }))).not.toContain("C01");
  });
  it("se desbloquea con 7 días", () => {
    expect(unlockedIds(baseCtx({ streakDays: 7 }))).toContain("C01");
  });
  it("se desbloquea con 21 días (superset)", () => {
    expect(unlockedIds(baseCtx({ streakDays: 21 }))).toContain("C01");
  });
});

describe("C02 — streak_days_21", () => {
  it("no se desbloquea con 20 días", () => {
    expect(unlockedIds(baseCtx({ streakDays: 20 }))).not.toContain("C02");
  });
  it("se desbloquea exactamente en 21", () => {
    expect(unlockedIds(baseCtx({ streakDays: 21 }))).toContain("C02");
  });
});

describe("C03 — tournament_100", () => {
  it("no se desbloquea con 99%", () => {
    expect(unlockedIds(baseCtx({ tournamentCompletionPercent: 99 }))).not.toContain("C03");
  });
  it("se desbloquea con 100%", () => {
    expect(unlockedIds(baseCtx({ tournamentCompletionPercent: 100 }))).toContain("C03");
  });
});

describe("C04 — group_first_day", () => {
  it("no se desbloquea si loadedGroupFirstDay es false", () => {
    expect(unlockedIds(baseCtx({ loadedGroupFirstDay: false }))).not.toContain("C04");
  });
  it("se desbloquea cuando loadedGroupFirstDay es true", () => {
    expect(unlockedIds(baseCtx({ loadedGroupFirstDay: true }))).toContain("C04");
  });
});

// ─── Social achievements ──────────────────────────────────────────────

describe("S01 — first_post", () => {
  it("no se desbloquea con 0 posts", () => {
    expect(unlockedIds(baseCtx({ postsCount: 0 }))).not.toContain("S01");
  });
  it("se desbloquea con 1 post", () => {
    expect(unlockedIds(baseCtx({ postsCount: 1 }))).toContain("S01");
  });
});

describe("S02 — post_10_reactions", () => {
  it("no se desbloquea con 9 reacciones", () => {
    expect(unlockedIds(baseCtx({ bestPostReactions: 9 }))).not.toContain("S02");
  });
  it("se desbloquea con 10 reacciones", () => {
    expect(unlockedIds(baseCtx({ bestPostReactions: 10 }))).toContain("S02");
  });
});

describe("S03 — external_shares_5", () => {
  it("no se desbloquea con 4 shares", () => {
    expect(unlockedIds(baseCtx({ externalSharesCount: 4 }))).not.toContain("S03");
  });
  it("se desbloquea con 5 shares", () => {
    expect(unlockedIds(baseCtx({ externalSharesCount: 5 }))).toContain("S03");
  });
});

describe("S04 — comments_made_10", () => {
  it("no se desbloquea con 9 posts distintos comentados", () => {
    expect(unlockedIds(baseCtx({ commentsMadeOnDistinctPostsCount: 9 }))).not.toContain("S04");
  });
  it("se desbloquea con 10", () => {
    expect(unlockedIds(baseCtx({ commentsMadeOnDistinctPostsCount: 10 }))).toContain("S04");
  });
});

describe("S05 — friends_active_3", () => {
  it("no se desbloquea con 2 amigos", () => {
    expect(unlockedIds(baseCtx({ activatedFriendsCount: 2 }))).not.toContain("S05");
  });
  it("se desbloquea con 3 amigos", () => {
    expect(unlockedIds(baseCtx({ activatedFriendsCount: 3 }))).toContain("S05");
  });
});

// ─── Position achievements ────────────────────────────────────────────

describe("P01 — position_top_10", () => {
  it("no se desbloquea con posición 0 (sin ranking)", () => {
    expect(unlockedIds(baseCtx({ position: 0 }))).not.toContain("P01");
  });
  it("no se desbloquea en posición 11", () => {
    expect(unlockedIds(baseCtx({ position: 11 }))).not.toContain("P01");
  });
  it("se desbloquea en posición 10", () => {
    expect(unlockedIds(baseCtx({ position: 10 }))).toContain("P01");
  });
  it("se desbloquea en posición 1 (superset)", () => {
    expect(unlockedIds(baseCtx({ position: 1 }))).toContain("P01");
  });
});

describe("P02 — position_top_3", () => {
  it("no se desbloquea en posición 4", () => {
    expect(unlockedIds(baseCtx({ position: 4 }))).not.toContain("P02");
  });
  it("se desbloquea en posición 3", () => {
    expect(unlockedIds(baseCtx({ position: 3 }))).toContain("P02");
  });
  it("se desbloquea en posición 1 (superset)", () => {
    expect(unlockedIds(baseCtx({ position: 1 }))).toContain("P02");
  });
});

describe("P03 — position_1", () => {
  it("no se desbloquea en posición 2", () => {
    expect(unlockedIds(baseCtx({ position: 2 }))).not.toContain("P03");
  });
  it("se desbloquea solo en posición 1", () => {
    expect(unlockedIds(baseCtx({ position: 1 }))).toContain("P03");
  });
});

describe("P04 — weekly_rise_10", () => {
  it("no se desbloquea con delta 9", () => {
    expect(unlockedIds(baseCtx({ weeklyPositionDelta: 9 }))).not.toContain("P04");
  });
  it("se desbloquea con delta 10", () => {
    expect(unlockedIds(baseCtx({ weeklyPositionDelta: 10 }))).toContain("P04");
  });
  it("no se desbloquea con delta negativo (bajó)", () => {
    expect(unlockedIds(baseCtx({ weeklyPositionDelta: -5 }))).not.toContain("P04");
  });
});

describe("P05 — eliminado", () => {
  it("ya no existe en el catálogo", () => {
    expect(unlockedIds(baseCtx({ tournamentEnded: true, tournamentWinnerUserId: "u-test" }))).not.toContain("P05");
  });
});

// ─── Predicción especial: Subcampeón / Finalistas ─────────────────────

describe("A06 — runner_up_correct", () => {
  it("no se desbloquea sin subcampeón real", () => {
    expect(unlockedIds(baseCtx({ predictedRunnerUpCode: "fr", actualRunnerUpCode: null }))).not.toContain("A06");
  });
  it("no se desbloquea si difiere", () => {
    expect(unlockedIds(baseCtx({ predictedRunnerUpCode: "fr", actualRunnerUpCode: "br" }))).not.toContain("A06");
  });
  it("se desbloquea si coincide", () => {
    expect(unlockedIds(baseCtx({ predictedRunnerUpCode: "fr", actualRunnerUpCode: "fr" }))).toContain("A06");
  });
});

describe("A07 — finalists_correct", () => {
  it("no se desbloquea si falta data", () => {
    expect(unlockedIds(baseCtx({ predictedChampionCode: "ar", actualChampionCode: "ar" }))).not.toContain("A07");
  });
  it("se desbloquea si acertó ambos finalistas (mismo orden)", () => {
    const ctx = baseCtx({
      predictedChampionCode: "ar",
      predictedRunnerUpCode: "fr",
      actualChampionCode: "ar",
      actualRunnerUpCode: "fr",
    });
    expect(unlockedIds(ctx)).toContain("A07");
  });
  it("se desbloquea aunque haya invertido quién gana (set de finalistas)", () => {
    const ctx = baseCtx({
      predictedChampionCode: "fr",
      predictedRunnerUpCode: "ar",
      actualChampionCode: "ar",
      actualRunnerUpCode: "fr",
    });
    expect(unlockedIds(ctx)).toContain("A07");
  });
  it("no se desbloquea si uno de los finalistas no coincide", () => {
    const ctx = baseCtx({
      predictedChampionCode: "ar",
      predictedRunnerUpCode: "br",
      actualChampionCode: "ar",
      actualRunnerUpCode: "fr",
    });
    expect(unlockedIds(ctx)).not.toContain("A07");
  });
});

// ─── Deduplication ────────────────────────────────────────────────────

describe("evaluateAchievements — deduplicación", () => {
  it("no desbloquea lo que ya está desbloqueado", () => {
    const ctx = baseCtx({ postsCount: 5, exactStreak: 10, position: 1 });
    const alreadyUnlocked = new Set(["S01", "A01", "P01", "P02", "P03"]);
    const results = evaluateAchievements(ctx, alreadyUnlocked);
    const ids = results.map((r) => r.achievement.id);
    for (const id of alreadyUnlocked) {
      expect(ids).not.toContain(id);
    }
  });

  it("desbloquea todo cuando alreadyUnlocked está vacío", () => {
    const ctx = baseCtx({ postsCount: 1, exactStreak: 5, position: 1, streakDays: 21, loadedGroupFirstDay: true });
    const ids = evaluateAchievements(ctx).map((r) => r.achievement.id);
    expect(ids).toContain("S01");
    expect(ids).toContain("A01");
    expect(ids).toContain("P01");
    expect(ids).toContain("P02");
    expect(ids).toContain("P03");
    expect(ids).toContain("C01");
    expect(ids).toContain("C02");
    expect(ids).toContain("C04");
  });
});

// ─── evaluateForEvent scopes ──────────────────────────────────────────

describe("evaluateForEvent — scope social", () => {
  it("solo evalúa logros sociales", () => {
    const ctx = baseCtx({
      postsCount: 1,
      bestPostReactions: 10,
      // también cumple condiciones de otros scopes:
      exactStreak: 5,
      position: 1,
      streakDays: 7,
    });
    const ids = evaluateForEvent("social", ctx).map((r) => r.achievement.id);
    expect(ids).toContain("S01");
    expect(ids).toContain("S02");
    // no debe incluir logros de otros scopes
    expect(ids).not.toContain("A01");
    expect(ids).not.toContain("P01");
    expect(ids).not.toContain("C01");
  });
});

describe("evaluateForEvent — scope daily-cron", () => {
  it("evalúa solo streak_days y group_first_day", () => {
    const ctx = baseCtx({ streakDays: 7, loadedGroupFirstDay: true, postsCount: 5 });
    const ids = evaluateForEvent("daily-cron", ctx).map((r) => r.achievement.id);
    expect(ids).toContain("C01");
    expect(ids).toContain("C04");
    expect(ids).not.toContain("S01");
  });

  it("respeta deduplicación en scope", () => {
    const ctx = baseCtx({ streakDays: 21 });
    const already = new Set(["C01", "C02"]);
    const results = evaluateForEvent("daily-cron", ctx, already);
    expect(results).toHaveLength(0);
  });
});

describe("evaluateForEvent — scope weekly-cron", () => {
  it("solo evalúa weekly_rise_10", () => {
    const ctx = baseCtx({ weeklyPositionDelta: 15, postsCount: 10, streakDays: 21 });
    const ids = evaluateForEvent("weekly-cron", ctx).map((r) => r.achievement.id);
    expect(ids).toEqual(["P04"]);
  });

  it("retorna vacío si no cumple el delta", () => {
    const ctx = baseCtx({ weeklyPositionDelta: 5 });
    expect(evaluateForEvent("weekly-cron", ctx)).toHaveLength(0);
  });
});

describe("evaluateForEvent — scope match-settled", () => {
  it("incluye logros de skill/consistencia pero NO posición ni sociales", () => {
    const ctx = baseCtx({ exactStreak: 5, position: 1, postsCount: 10, tournamentCompletionPercent: 100 });
    const ids = evaluateForEvent("match-settled", ctx).map((r) => r.achievement.id);
    expect(ids).toContain("A01");
    expect(ids).toContain("C03");
    // posición se reconcilia ranking-wide, no en match-settled
    expect(ids).not.toContain("P01");
    expect(ids).not.toContain("P02");
    expect(ids).not.toContain("P03");
    expect(ids).not.toContain("S01");
  });
});

describe("evaluateForEvent — scope position", () => {
  it("solo evalúa los logros de posición", () => {
    const ctx = baseCtx({ position: 1, exactStreak: 5, postsCount: 10, streakDays: 7 });
    const ids = evaluateForEvent("position", ctx).map((r) => r.achievement.id);
    expect(ids).toContain("P01");
    expect(ids).toContain("P02");
    expect(ids).toContain("P03");
    // nada de otros scopes
    expect(ids).not.toContain("A01");
    expect(ids).not.toContain("S01");
    expect(ids).not.toContain("C01");
  });

  it("respeta deduplicación", () => {
    const ctx = baseCtx({ position: 2 });
    const already = new Set(["P01"]);
    const ids = evaluateForEvent("position", ctx, already).map((r) => r.achievement.id);
    expect(ids).not.toContain("P01");
    expect(ids).toContain("P02");
  });
});

// ─── positionAchievementIdsFor (umbrales ranking-wide) ────────────────

describe("positionAchievementIdsFor", () => {
  it("sin ranking (posición 0) no merece ningún logro", () => {
    expect(positionAchievementIdsFor(0)).toEqual([]);
  });
  it("fuera del top 10 (posición 11) no merece ninguno", () => {
    expect(positionAchievementIdsFor(11)).toEqual([]);
  });
  it("top 10 (posición 10) merece solo P01", () => {
    expect(positionAchievementIdsFor(10).sort()).toEqual(["P01"]);
  });
  it("podio (posición 3) merece P01 y P02", () => {
    expect(positionAchievementIdsFor(3).sort()).toEqual(["P01", "P02"]);
  });
  it("líder (posición 1) merece P01, P02 y P03", () => {
    expect(positionAchievementIdsFor(1).sort()).toEqual(["P01", "P02", "P03"]);
  });
  it("POSITION_ACHIEVEMENT_IDS expone P01-P03", () => {
    expect([...POSITION_ACHIEVEMENT_IDS].sort()).toEqual(["P01", "P02", "P03"]);
  });
});

// ─── Idempotencia ─────────────────────────────────────────────────────

describe("evaluateAchievements — idempotencia", () => {
  it("llamar dos veces con el mismo contexto devuelve el mismo resultado", () => {
    const ctx = baseCtx({ postsCount: 3, exactStreak: 6, position: 2 });
    const r1 = evaluateAchievements(ctx).map((r) => r.achievement.id).sort();
    const r2 = evaluateAchievements(ctx).map((r) => r.achievement.id).sort();
    expect(r1).toEqual(r2);
  });
});
