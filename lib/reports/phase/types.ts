/**
 * O2 PRODE — Tipos del reporte de actividad por fase.
 * Ver docs/PHASE_REPORT_BRIEF.md §3.
 */

/** Coincide 1:1 con el enum `phase_t` de Postgres (6 fases, incluye 16avos). */
export type TournamentPhase =
  | "groups"
  | "round-of-32"
  | "round-of-16"
  | "quarter"
  | "semi"
  | "final";

/** Orden de fases del torneo — usado para resolver "fase anterior" (deltas). */
export const PHASE_ORDER: TournamentPhase[] = [
  "groups",
  "round-of-32",
  "round-of-16",
  "quarter",
  "semi",
  "final",
];

/** Un KPI con su valor actual y el delta absoluto vs la fase anterior. */
export interface KpiDelta {
  current: number;
  /** null en la primera fase (no hay fase previa contra la cual comparar). */
  delta: number | null;
}

export interface PhaseWinner {
  position: number;
  name: string;
  prize: string;
  phaseLabel: string;
}

export interface WeekBucket {
  weekLabel: string;
  value: number;
}

/** Tendencia de la interacción semanal → elige la context phrase (copy honesto). */
export type InteractionTrend = "growth" | "frontloaded" | "steady";

/**
 * Objeto tipado con TODOS los datos del reporte de una fase.
 * Lo produce `computeMetrics(phase)`; lo consumen `renderHTML` y `renderPNG`.
 */
export interface PhaseMetrics {
  phase: TournamentPhase;
  phaseLabel: string;
  periodStart: string; // ISO
  periodEnd: string; // ISO
  weekLabel: string; // "del 11 al 28 de junio"
  headlineSummary: string;

  // Bloque 2 — KPIs con delta vs fase anterior
  kpis: {
    activeUsers: KpiDelta;
    predictionsLoaded: KpiDelta;
    newUsers: KpiDelta;
    participation: KpiDelta; // %
  };

  // Bloque 3 — Interacción semana a semana dentro de la fase
  weeklyInteraction: WeekBucket[];
  /** Tendencia derivada del dato real → selecciona la frase de contexto. */
  interactionTrend: InteractionTrend;

  // Bloque 4 — Nuevos usuarios por semana + acumulado del torneo
  weeklyNewUsers: Array<{ weekLabel: string; count: number; cumulative: number }>;

  // Bloque 5 — Predicciones por semana + promedio por activo
  weeklyPredictions: WeekBucket[];
  avgPredictionsPerActive: number;

  // Bloque 6 — Ganadores (de prize_award)
  winners: PhaseWinner[];

  // Bloque 7 — Secundarios
  accuracyPercent: number;
  userTypeBreakdown: { new: number; recurrent: number; power: number };
  /** Vacío si `user` no tiene campo de sucursal (hoy no lo tiene). */
  branchBreakdown: Array<{ branch: string; count: number; percent: number }>;

  // Bloque 8 — Cierre
  closingText: string;
}
