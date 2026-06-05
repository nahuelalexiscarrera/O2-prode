/**
 * O2 PRODE — football-data.org · mapeos
 *
 * football-data.org identifica equipos por TLA (tricódigo FIFA: MEX, BRA…).
 * Nuestra DB usa ISO alpha-2 (mx, br…). Verificado contra los 48 del Mundial 2026.
 */

import type { Phase, MatchStatus } from "@/types/domain";

/** TLA (football-data.org) → código ISO-2 (nuestra DB) — 48 equipos del Mundial 2026 */
export const TLA_TO_CODE: Record<string, string> = {
  ALG: "dz", ARG: "ar", AUS: "au", AUT: "at", BEL: "be", BIH: "ba", BRA: "br",
  CAN: "ca", CIV: "ci", COD: "cd", COL: "co", CPV: "cv", CRO: "hr", CUW: "cw",
  CZE: "cz", ECU: "ec", EGY: "eg", ENG: "gb-eng", ESP: "es", FRA: "fr", GER: "de",
  GHA: "gh", HAI: "ht", IRN: "ir", IRQ: "iq", JOR: "jo", JPN: "jp", KOR: "kr",
  KSA: "sa", MAR: "ma", MEX: "mx", NED: "nl", NOR: "no", NZL: "nz", PAN: "pa",
  PAR: "py", POR: "pt", QAT: "qa", RSA: "za", SCO: "gb-sct", SEN: "sn", SUI: "ch",
  SWE: "se", TUN: "tn", TUR: "tr", URY: "uy", USA: "us", UZB: "uz",
};

/** Convierte el stage de football-data.org a nuestra fase. */
export function stageToPhase(stage: string): Phase | null {
  switch (stage) {
    case "GROUP_STAGE":
      return "groups";
    case "LAST_32":
      return "round-of-32";
    case "LAST_16":
      return "round-of-16";
    case "QUARTER_FINALS":
      return "quarter";
    case "SEMI_FINALS":
      return "semi";
    case "THIRD_PLACE":
      // El partido por el 3er puesto: mismo nivel/multiplicador que semifinal.
      return "semi";
    case "FINAL":
      return "final";
    default:
      return null;
  }
}

/** Convierte el status de football-data.org a nuestro match_status_t. */
export function fdStatusToMatch(status: string): MatchStatus | null {
  switch (status) {
    case "FINISHED":
    case "AWARDED":
      return "finished";
    case "IN_PLAY":
    case "PAUSED":
    case "LIVE":
      return "live";
    case "SCHEDULED":
    case "TIMED":
      return "scheduled";
    case "POSTPONED":
    case "SUSPENDED":
    case "CANCELLED":
      return "postponed";
    default:
      return null;
  }
}
