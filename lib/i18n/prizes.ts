/**
 * O2 PRODE — Premios del torneo (copy tipado).
 *
 * Source of truth del copy: lib/i18n/es-AR.json → key `prizes`. Acá lo
 * importamos y lo tipamos para que el bloque de premios (UI estática) lo
 * consuma con type-safety. Mismo patrón que lib/i18n/team-codes.ts.
 *
 * NO hay lógica de asignación, DB ni server actions: es comunicación pura.
 */

import esAR from "./es-AR.json";

export interface PrizeTier {
  /** "P1-grupos" .. "P7-final-3" */
  id: string;
  /** "Fase de grupos" | "Octavos de final" | ... | "Final" */
  phaseLabel: string;
  /** "1° puesto" | "Líder acumulado" | "Campeón del PRODE" | ... */
  rankLabel: string;
  /** "1 mes de O2 gratis" | "1 año de O2 gratis" | ... */
  reward: string;
}

export interface PrizesCopy {
  sectionTitle: string;
  sectionEyebrow: string;
  anchorId: string;
  tiers: PrizeTier[];
  ruleTitle: string;
  ruleBody: string;
  coordinationNote: string;
  linkFromHome: string;
  linkFromProfile: string;
  onboardingMention: string;
}

export const PRIZES = esAR.prizes as PrizesCopy;

/** Tratamiento visual de cada card. Las 3 de la Final se jerarquizan. */
export type PrizeTone = "default" | "champion" | "runnerUp" | "third";

/**
 * Tono por posición en el array `tiers` (cerrado en el brief):
 *  0-3 → default · 4 → champion (1 año) · 5 → runnerUp · 6 → third.
 */
export function prizeTone(index: number): PrizeTone {
  if (index === 4) return "champion";
  if (index === 5) return "runnerUp";
  if (index === 6) return "third";
  return "default";
}
