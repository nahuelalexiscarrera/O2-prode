// @vitest-environment node
/**
 * O2 PRODE — Scoring Calculator · Test Suite
 * Agente 9 · Game Logic
 *
 * Vitest. Covers every scoring rule defined in Agente 2 §7.
 * If any of these fail, the engine is broken. Cero excepciones.
 */

import { describe, it, expect } from "vitest";
import { calculateMatchPoints, InvalidScoreError, UnknownPhaseError } from "../calculator";
import { calculateSpecialPoints } from "../specials";
import {
  calculateStreakBonus,
  calculateGroupBonus,
  calculatePerfectDayBonus,
  calculateInactivityPenalty,
} from "../bonuses";
import { pointsToLevel, computeRanking, rankingContextWindow } from "@/lib/ranking/compute";

describe("calculateMatchPoints — base scoring rules (Agente 2 §7)", () => {
  it("acierto exacto en grupos → 8 pts × 1 = 8", () => {
    const r = calculateMatchPoints({
      prediction: { homeScore: 2, awayScore: 1 },
      result: { homeScore: 2, awayScore: 1 },
      phase: "groups",
    });
    expect(r.exactResult).toBe(8);
    expect(r.total).toBe(8);
  });

  it("acierto exacto 0-0 en grupos → 8 pts", () => {
    const r = calculateMatchPoints({
      prediction: { homeScore: 0, awayScore: 0 },
      result: { homeScore: 0, awayScore: 0 },
      phase: "groups",
    });
    expect(r.exactResult).toBe(8);
    expect(r.total).toBe(8);
  });

  it("acierto ganador + bonus diff (3-1 dijiste, 2-0 fue) → (3+2) × 1 = 5", () => {
    const r = calculateMatchPoints({
      prediction: { homeScore: 3, awayScore: 1 },
      result: { homeScore: 2, awayScore: 0 },
      phase: "groups",
    });
    expect(r.winnerCorrect).toBe(3);
    expect(r.diffBonus).toBe(2);
    expect(r.total).toBe(5);
  });

  it("acierto ganador sin bonus diff (2-0 dijiste, 1-0 fue) → 3 pts", () => {
    const r = calculateMatchPoints({
      prediction: { homeScore: 2, awayScore: 0 },
      result: { homeScore: 1, awayScore: 0 },
      phase: "groups",
    });
    expect(r.winnerCorrect).toBe(3);
    expect(r.diffBonus).toBe(0);
    expect(r.total).toBe(3);
  });

  it("empate sin score exacto (1-1 dijiste, 2-2 fue) → 1 + 2 (diff 0 = 0) = 3", () => {
    const r = calculateMatchPoints({
      prediction: { homeScore: 1, awayScore: 1 },
      result: { homeScore: 2, awayScore: 2 },
      phase: "groups",
    });
    expect(r.drawCorrect).toBe(1);
    expect(r.diffBonus).toBe(2);
    expect(r.total).toBe(3);
  });

  it("predicción totalmente fallada → 0 pts", () => {
    const r = calculateMatchPoints({
      prediction: { homeScore: 3, awayScore: 0 },
      result: { homeScore: 0, awayScore: 3 },
      phase: "groups",
    });
    expect(r.total).toBe(0);
  });

  it("diff bonus NO se otorga si el ganador erró (regla GL-D4)", () => {
    // 2-1 dijiste, 0-1 fue: misma diff |1| pero ganador opuesto
    const r = calculateMatchPoints({
      prediction: { homeScore: 2, awayScore: 1 },
      result: { homeScore: 0, awayScore: 1 },
      phase: "groups",
    });
    expect(r.winnerCorrect).toBe(0);
    expect(r.diffBonus).toBe(0);
    expect(r.total).toBe(0);
  });
});

describe("calculateMatchPoints — phase multipliers", () => {
  it("octavos x2: exacto = 16 pts", () => {
    const r = calculateMatchPoints({
      prediction: { homeScore: 2, awayScore: 1 },
      result: { homeScore: 2, awayScore: 1 },
      phase: "round-of-16",
    });
    expect(r.phaseMultiplier).toBe(2);
    expect(r.total).toBe(16);
  });

  it("cuartos x3: exacto = 24 pts", () => {
    const r = calculateMatchPoints({
      prediction: { homeScore: 1, awayScore: 0 },
      result: { homeScore: 1, awayScore: 0 },
      phase: "quarter",
    });
    expect(r.total).toBe(24);
  });

  it("semis x4: exacto = 32 pts", () => {
    const r = calculateMatchPoints({
      prediction: { homeScore: 3, awayScore: 2 },
      result: { homeScore: 3, awayScore: 2 },
      phase: "semi",
    });
    expect(r.total).toBe(32);
  });

  it("final x5: exacto = 40 pts (el momento dramático)", () => {
    const r = calculateMatchPoints({
      prediction: { homeScore: 2, awayScore: 1 },
      result: { homeScore: 2, awayScore: 1 },
      phase: "final",
    });
    expect(r.phaseMultiplier).toBe(5);
    expect(r.total).toBe(40);
  });

  it("cuartos x3 + ganador correcto + bonus diff: (3+2)*3 = 15", () => {
    const r = calculateMatchPoints({
      prediction: { homeScore: 2, awayScore: 1 },
      result: { homeScore: 3, awayScore: 2 },
      phase: "quarter",
    });
    expect(r.total).toBe(15);
  });
});

describe("calculateMatchPoints — validation", () => {
  it("rechaza score negativo", () => {
    expect(() =>
      calculateMatchPoints({
        prediction: { homeScore: -1, awayScore: 0 },
        result: { homeScore: 0, awayScore: 0 },
        phase: "groups",
      })
    ).toThrow(InvalidScoreError);
  });

  it("rechaza score > 20", () => {
    expect(() =>
      calculateMatchPoints({
        prediction: { homeScore: 21, awayScore: 0 },
        result: { homeScore: 0, awayScore: 0 },
        phase: "groups",
      })
    ).toThrow(InvalidScoreError);
  });

  it("rechaza score no entero", () => {
    expect(() =>
      calculateMatchPoints({
        prediction: { homeScore: 1.5, awayScore: 0 },
        result: { homeScore: 0, awayScore: 0 },
        phase: "groups",
      })
    ).toThrow(InvalidScoreError);
  });

  it("rechaza fase desconocida", () => {
    expect(() =>
      calculateMatchPoints({
        prediction: { homeScore: 1, awayScore: 0 },
        result: { homeScore: 1, awayScore: 0 },
        // @ts-expect-error testing invalid phase
        phase: "extra-time",
      })
    ).toThrow(UnknownPhaseError);
  });
});

describe("calculateSpecialPoints", () => {
  it("acierto total → 40 + 20 + 30 + 15 + 15 = 120", () => {
    const r = calculateSpecialPoints({
      prediction: {
        championCode: "ar",
        runnerUpCode: "br",
        topScorerPlayerId: "p-mbappe",
        groupStageBestCode: "fr",
        revelationCode: "ma",
      },
      actual: {
        championCode: "ar",
        runnerUpCode: "br",
        topScorerPlayerId: "p-mbappe",
        groupStageBestCode: "fr",
        revelationCode: "ma",
      },
    });
    expect(r.total).toBe(120);
  });

  it("solo campeón acierta → 40 pts", () => {
    const r = calculateSpecialPoints({
      prediction: {
        championCode: "ar",
        runnerUpCode: "br",
        topScorerPlayerId: "p-mbappe",
        groupStageBestCode: "fr",
        revelationCode: "ma",
      },
      actual: {
        championCode: "ar",
        runnerUpCode: "fr",
        topScorerPlayerId: "p-messi",
        groupStageBestCode: "es",
        revelationCode: "jp",
      },
    });
    expect(r.champion).toBe(40);
    expect(r.total).toBe(40);
  });

  it("ningún acierto → 0", () => {
    const r = calculateSpecialPoints({
      prediction: {
        championCode: "ar",
        runnerUpCode: "br",
        topScorerPlayerId: "p-mbappe",
        groupStageBestCode: "fr",
        revelationCode: "ma",
      },
      actual: {
        championCode: "de",
        runnerUpCode: "fr",
        topScorerPlayerId: "p-messi",
        groupStageBestCode: "es",
        revelationCode: "jp",
      },
    });
    expect(r.total).toBe(0);
  });
});

describe("Bonuses — streaks", () => {
  it("racha < 7 días → 0", () => {
    expect(calculateStreakBonus(6)).toBe(0);
  });

  it("racha 7 días → 10", () => {
    expect(calculateStreakBonus(7)).toBe(10);
  });

  it("racha 14 días → 10 + 15 = 25", () => {
    expect(calculateStreakBonus(14)).toBe(25);
  });

  it("racha 21 días → 10 + 15 + 15 = 40", () => {
    expect(calculateStreakBonus(21)).toBe(40);
  });

  it("racha 10 días → solo el primer bloque cuenta → 10", () => {
    expect(calculateStreakBonus(10)).toBe(10);
  });
});

describe("Bonuses — group completion", () => {
  it("6 winners correctos → 5 pts", () => {
    expect(calculateGroupBonus({ predictedCount: 6, winnersCorrect: 6, exactsCorrect: 0 })).toBe(5);
  });

  it("3 exacts → 10 pts adicionales", () => {
    expect(calculateGroupBonus({ predictedCount: 6, winnersCorrect: 6, exactsCorrect: 3 })).toBe(
      15
    );
  });

  it("5 winners (incompleto) → 0", () => {
    expect(calculateGroupBonus({ predictedCount: 5, winnersCorrect: 5, exactsCorrect: 1 })).toBe(0);
  });
});

describe("Bonuses — perfect day & penalty", () => {
  it("4/4 winners → 8 pts", () => {
    expect(calculatePerfectDayBonus({ matchesPlayed: 4, winnersCorrect: 4 })).toBe(8);
  });

  it("3/4 winners → 0", () => {
    expect(calculatePerfectDayBonus({ matchesPlayed: 4, winnersCorrect: 3 })).toBe(0);
  });

  it("3 missed in week → -2 pts (weekly only)", () => {
    expect(calculateInactivityPenalty({ missedMatchesInWeek: 3 })).toBe(-2);
  });

  it("2 missed → 0 (no penalty yet)", () => {
    expect(calculateInactivityPenalty({ missedMatchesInWeek: 2 })).toBe(0);
  });
});

describe("Ranking · compute & pointsToLevel", () => {
  const users = [
    {
      id: "u1",
      name: "Martín",
      initials: "M",
      avatarUrl: null,
      level: 5 as const,
      points: 156,
      joinedAt: "2026-04-10",
    },
    {
      id: "u2",
      name: "Lucas",
      initials: "L",
      avatarUrl: null,
      level: 4 as const,
      points: 142,
      joinedAt: "2026-04-10",
    },
    {
      id: "u3",
      name: "Nahuel",
      initials: "N",
      avatarUrl: null,
      level: 3 as const,
      points: 124,
      joinedAt: "2026-04-12",
    },
    {
      id: "u4",
      name: "Tied A",
      initials: "A",
      avatarUrl: null,
      level: 2 as const,
      points: 100,
      joinedAt: "2026-04-11",
    },
    {
      id: "u5",
      name: "Tied B",
      initials: "B",
      avatarUrl: null,
      level: 2 as const,
      points: 100,
      joinedAt: "2026-04-15",
    },
  ];

  it("ordena por puntos descendente", () => {
    const r = computeRanking(users);
    expect(r[0]?.position).toBe(1);
    expect(r[0]?.userId).toBe("u1");
    expect(r[2]?.userId).toBe("u3");
  });

  it("desempata por joinedAt ascendente (loyalty)", () => {
    const r = computeRanking(users);
    const tiedA = r.find((e) => e.userId === "u4");
    const tiedB = r.find((e) => e.userId === "u5");
    expect((tiedA?.position ?? 0) < (tiedB?.position ?? 0)).toBe(true);
  });

  it("rankingContextWindow toma ±5 alrededor", () => {
    const r = computeRanking(users);
    const ctx = rankingContextWindow(r, "u3", 1);
    expect(ctx).toHaveLength(3);
    expect(ctx[1]?.userId).toBe("u3");
  });

  it("pointsToLevel correcto en cada threshold", () => {
    expect(pointsToLevel(0).level).toBe(1);
    expect(pointsToLevel(50).level).toBe(1);
    expect(pointsToLevel(51).level).toBe(2);
    expect(pointsToLevel(150).level).toBe(2);
    expect(pointsToLevel(151).level).toBe(3);
    expect(pointsToLevel(300).level).toBe(3);
    expect(pointsToLevel(301).level).toBe(4);
    expect(pointsToLevel(500).level).toBe(4);
    expect(pointsToLevel(501).level).toBe(5);
    expect(pointsToLevel(501).levelName).toBe("Leyenda O2");
  });
});
