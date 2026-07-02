/**
 * O2 PRODE — Reporte de actividad por fase (copy tipado).
 *
 * Source of truth del copy: lib/i18n/es-AR.json → key `reports.phase`. Acá lo
 * importamos y lo tipamos para que el motor de reportes lo consuma con
 * type-safety. Mismo patrón que lib/i18n/prizes.ts.
 *
 * NO hay lógica acá: es comunicación pura. Ver docs/PHASE_REPORT_BRIEF.md §6.
 */

import type { InteractionTrend, TournamentPhase } from "@/lib/reports/phase/types";
import esAR from "./es-AR.json";

export interface ReportPhaseCopy {
  productName: string;
  titleTemplate: string;
  periodTemplate: string;
  footer: string;
  phaseLabels: Record<TournamentPhase, string>;
  kpiLabels: {
    activeUsers: string;
    predictionsLoaded: string;
    newUsers: string;
    participation: string;
  };
  sections: {
    interaction: string;
    newUsers: string;
    predictions: string;
    winners: string;
    secondary: string;
  };
  contextPhrases: {
    /** Variante según la tendencia real de la interacción semanal. */
    interaction: Record<InteractionTrend, string>;
    newUsersRegistration: string;
    predictionsUsage: string;
    winnersProof: string;
  };
  /** Copy de cierre por fase recién cerrada. R32 se agregó al corregir el brief. */
  closing: {
    afterGroups: string;
    afterR32: string;
    afterR16: string;
    afterQF: string;
    afterSF: string;
    afterFinal: string;
  };
  email: {
    subjectTemplate: string;
    greeting: string;
    bodyIntro: string;
    kpiIntro: string;
    linkLabel: string;
    signOff: string;
  };
}

export const REPORTS = esAR.reports as { phase: ReportPhaseCopy };

/** Copy de cierre según la fase que se acaba de cerrar. */
export function closingForPhase(phase: TournamentPhase): string {
  const c = REPORTS.phase.closing;
  switch (phase) {
    case "groups":
      return c.afterGroups;
    case "round-of-32":
      return c.afterR32;
    case "round-of-16":
      return c.afterR16;
    case "quarter":
      return c.afterQF;
    case "semi":
      return c.afterSF;
    case "final":
      return c.afterFinal;
  }
}
