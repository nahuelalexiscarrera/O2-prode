// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  type RawPhaseData,
  aggregate,
  esDecimal,
  formatPeriodEs,
  interactionTrendOf,
  pct,
} from "../computeMetrics";

/**
 * Tests anclados a DATOS REALES de la fase `groups` en producción
 * (snapshot read-only 2026-06-30):
 *   93 activos · 3019 predicciones · 2936 settled · 1642 aciertos ·
 *   131 socios totales · accuracy = 55,9% (coincide con el ejemplo del brief).
 */
describe("fórmulas contra números reales de groups (prod)", () => {
  it("accuracy 1642/2936 = 55,9%", () => {
    expect(pct(1642, 2936)).toBe(55.9);
    expect(esDecimal(pct(1642, 2936))).toBe("55,9");
  });
  it("participación 93/131 = 71,0%", () => {
    expect(pct(93, 131)).toBe(71);
  });
  it("promedio de predicciones por activo 3019/93 ≈ 32,5", () => {
    const avg = Math.round((3019 / 93) * 10) / 10;
    expect(avg).toBe(32.5);
  });
});

describe("interactionTrendOf (copy honesto según el dato real)", () => {
  it("groups real 87→22→8 = frontloaded (NO 'creció')", () => {
    expect(interactionTrendOf([87, 22, 8])).toBe("frontloaded");
  });
  it("subida clara = growth", () => {
    expect(interactionTrendOf([10, 20, 30])).toBe("growth");
  });
  it("parejo = steady", () => {
    expect(interactionTrendOf([50, 50, 50])).toBe("steady");
  });
  it("una sola semana = steady", () => {
    expect(interactionTrendOf([42])).toBe("steady");
  });
});

describe("formatPeriodEs", () => {
  it("mismo mes", () => {
    expect(formatPeriodEs("2026-06-11T19:00:00Z", "2026-06-28T22:00:00Z")).toBe(
      "del 11 al 28 de junio"
    );
  });
  it("meses distintos", () => {
    expect(formatPeriodEs("2026-06-28T19:00:00Z", "2026-07-05T22:00:00Z")).toBe(
      "del 28 de junio al 5 de julio"
    );
  });
});

// ─── Fixture compacto pero real-shaped para probar aggregate() ───────────────
function groupsFixture(): RawPhaseData {
  return {
    phase: "groups",
    prevPhase: null,
    matches: [
      {
        id: "m1",
        phase: "groups",
        kickoffAt: "2026-06-11T19:00:00Z",
        homeScore: 2,
        awayScore: 1,
        finishedAt: "2026-06-11T21:00:00Z",
      },
      {
        id: "m2",
        phase: "groups",
        kickoffAt: "2026-06-12T19:00:00Z",
        homeScore: 0,
        awayScore: 0,
        finishedAt: "2026-06-12T21:00:00Z",
      },
    ],
    predictions: [
      // u1: ambas correctas (home win + draw)
      {
        userId: "u1",
        matchId: "m1",
        createdAt: "2026-06-10T10:00:00Z",
        homeScore: 2,
        awayScore: 1,
      },
      {
        userId: "u1",
        matchId: "m2",
        createdAt: "2026-06-10T10:00:00Z",
        homeScore: 1,
        awayScore: 1,
      },
      // u2: 1 correcta (away wrong, draw correct)
      {
        userId: "u2",
        matchId: "m1",
        createdAt: "2026-06-11T20:30:00Z",
        homeScore: 0,
        awayScore: 3,
      },
      {
        userId: "u2",
        matchId: "m2",
        createdAt: "2026-06-11T20:30:00Z",
        homeScore: 0,
        awayScore: 0,
      },
      // u3: 1 correcta (home win)
      {
        userId: "u3",
        matchId: "m1",
        createdAt: "2026-06-12T09:00:00Z",
        homeScore: 1,
        awayScore: 0,
      },
    ],
    users: [
      { id: "u1", joinedAt: "2026-06-01T00:00:00Z" }, // previo → recurrent
      { id: "u2", joinedAt: "2026-06-11T20:00:00Z" }, // en período → new
      { id: "u3", joinedAt: "2026-06-12T08:00:00Z" }, // en período → new
      { id: "u4", joinedAt: "2026-06-05T00:00:00Z" }, // previo, no activo
    ],
    tournamentPredCountByUser: { u1: 5, u2: 2, u3: 1, u4: 0 },
    winners: [{ position: 1, name: "Santiago", prize: "1 mes O2", phaseLabel: "Fase de grupos" }],
  };
}

describe("aggregate — estructura y reglas", () => {
  const m = aggregate(groupsFixture());

  it("label y período de la fase", () => {
    expect(m.phaseLabel).toBe("Fase de grupos");
    expect(m.periodStart).toBe("2026-06-11T19:00:00Z");
    expect(m.periodEnd).toBe("2026-06-12T21:00:00Z");
  });

  it("accuracy = 4/5 aciertos = 80%", () => {
    expect(m.accuracyPercent).toBe(80);
    expect(m.headlineSummary).toBe("Fase de grupos cerrada con 80,0% de acierto.");
  });

  it("KPIs: 3 activos, 5 predicciones, 2 nuevos, 75% participación", () => {
    expect(m.kpis.activeUsers.current).toBe(3);
    expect(m.kpis.predictionsLoaded.current).toBe(5);
    expect(m.kpis.newUsers.current).toBe(2);
    expect(m.kpis.participation.current).toBe(75);
  });

  it("primera fase → deltas null (nunca ▲/▼)", () => {
    expect(m.kpis.activeUsers.delta).toBeNull();
    expect(m.kpis.participation.delta).toBeNull();
  });

  it("promedio de predicciones por activo = 5/3 ≈ 1,7", () => {
    expect(m.avgPredictionsPerActive).toBe(1.7);
  });

  it("userTypeBreakdown: new=2, recurrent=1, power=1 (>= P90)", () => {
    expect(m.userTypeBreakdown).toEqual({ new: 2, recurrent: 1, power: 1 });
  });

  it("branchBreakdown vacío (user sin campo de sucursal)", () => {
    expect(m.branchBreakdown).toEqual([]);
  });

  it("winners passthrough desde prize_award", () => {
    expect(m.winners).toHaveLength(1);
    expect(m.winners[0]?.name).toBe("Santiago");
  });

  it("closingText de groups apunta a 16avos", () => {
    expect(m.closingText).toContain("16avos");
  });
});

describe("aggregate — deltas vs fase anterior", () => {
  it("con prevPhase computa delta absoluto (no null)", () => {
    const raw: RawPhaseData = {
      phase: "round-of-16",
      prevPhase: "round-of-32",
      matches: [
        {
          id: "r16-1",
          phase: "round-of-16",
          kickoffAt: "2026-07-04T19:00:00Z",
          homeScore: 1,
          awayScore: 0,
          finishedAt: "2026-07-04T21:00:00Z",
        },
        {
          id: "r32-1",
          phase: "round-of-32",
          kickoffAt: "2026-06-28T19:00:00Z",
          homeScore: 2,
          awayScore: 2,
          finishedAt: "2026-06-28T21:00:00Z",
        },
      ],
      predictions: [
        {
          userId: "a",
          matchId: "r16-1",
          createdAt: "2026-07-03T10:00:00Z",
          homeScore: 1,
          awayScore: 0,
        },
        {
          userId: "b",
          matchId: "r16-1",
          createdAt: "2026-07-03T10:00:00Z",
          homeScore: 1,
          awayScore: 0,
        },
        // prev: solo 1 activo
        {
          userId: "a",
          matchId: "r32-1",
          createdAt: "2026-06-27T10:00:00Z",
          homeScore: 2,
          awayScore: 2,
        },
      ],
      users: [
        { id: "a", joinedAt: "2026-06-01T00:00:00Z" },
        { id: "b", joinedAt: "2026-07-01T00:00:00Z" },
      ],
      tournamentPredCountByUser: { a: 2, b: 1 },
      winners: [],
    };
    const m = aggregate(raw);
    // r16 activos = 2, r32 activos = 1 → delta = +1
    expect(m.kpis.activeUsers.current).toBe(2);
    expect(m.kpis.activeUsers.delta).toBe(1);
    expect(m.closingText).toContain("cuartos");
  });
});
