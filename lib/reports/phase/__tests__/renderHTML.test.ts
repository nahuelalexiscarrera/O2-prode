// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderHTML } from "../renderHTML";
import type { PhaseMetrics } from "../types";

function metricsFixture(): PhaseMetrics {
  return {
    phase: "groups",
    phaseLabel: "Fase de grupos",
    periodStart: "2026-06-11T19:00:00Z",
    periodEnd: "2026-06-28T04:00:00Z",
    weekLabel: "del 11 al 28 de junio",
    headlineSummary: "Fase de grupos cerrada con 55,9% de acierto.",
    kpis: {
      activeUsers: { current: 93, delta: null },
      predictionsLoaded: { current: 3019, delta: null },
      newUsers: { current: 53, delta: null },
      participation: { current: 71, delta: null },
    },
    weeklyInteraction: [
      { weekLabel: "Semana 1", value: 80 },
      { weekLabel: "Semana 2", value: 88 },
      { weekLabel: "Semana 3", value: 93 },
    ],
    interactionTrend: "growth",
    weeklyNewUsers: [
      { weekLabel: "Semana 1", count: 30, cumulative: 108 },
      { weekLabel: "Semana 2", count: 12, cumulative: 120 },
      { weekLabel: "Semana 3", count: 11, cumulative: 131 },
    ],
    weeklyPredictions: [
      { weekLabel: "Semana 1", value: 1200 },
      { weekLabel: "Semana 2", value: 980 },
      { weekLabel: "Semana 3", value: 839 },
    ],
    avgPredictionsPerActive: 32.5,
    winners: [
      {
        position: 1,
        name: "Santiago Schwarzenberger",
        prize: "1 mes de O2 gratis",
        phaseLabel: "Fase de grupos",
      },
    ],
    accuracyPercent: 55.9,
    userTypeBreakdown: { new: 53, recurrent: 40, power: 9 },
    branchBreakdown: [],
    closingText:
      "Seguimos optimizando la experiencia fecha a fecha. Próxima entrega: cierre de 16avos.",
  };
}

describe("renderHTML", () => {
  const html = renderHTML(metricsFixture());

  it("snapshot del HTML (detecta cambios de copy involuntarios)", () => {
    expect(html).toMatchSnapshot();
  });

  it("incluye el headline y el período", () => {
    expect(html).toContain("55,9% de acierto");
    expect(html).toContain("del 11 al 28 de junio");
  });

  it("regla §7: verde para OK, gris para muted — nunca rojo", () => {
    expect(html).toContain("--ok:#10B981");
    // sin rojos de alarma: ni hex rojos comunes, ni color:red, ni token --error
    expect(html).not.toMatch(/#(ff0000|f00|e5484d|dc2626|ef4444|d4351c)/i);
    expect(html.toLowerCase()).not.toContain("color:red");
    expect(html).not.toContain("--error");
  });

  it("regla §7: exactamente 3 tamaños de letra", () => {
    const sizes = [...html.matchAll(/--fs-(lg|md|sm):/g)].map((x) => x[1]);
    expect(new Set(sizes)).toEqual(new Set(["lg", "md", "sm"]));
  });

  it("a11y §8: gráficos con role=img + aria-label", () => {
    expect(html).toContain('role="img"');
    expect(html).toContain("aria-label=");
  });

  it("escapa nombres de ganadores (XSS)", () => {
    const m = metricsFixture();
    m.winners = [
      { position: 1, name: "<script>x</script>", prize: "p", phaseLabel: "Fase de grupos" },
    ];
    expect(renderHTML(m)).not.toContain("<script>x</script>");
  });
});
