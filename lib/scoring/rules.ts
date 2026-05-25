/**
 * O2 PRODE — Scoring Rules (constants)
 * Agente 9 · Game Logic
 *
 * Source of truth for all scoring values. Mirror in SQL `fn_calculate_points`.
 * Don't import from here in components — use `lib/scoring/index.ts` API.
 */

import type { Phase } from "@/types/domain";

// ─── Base points per prediction ─────────────────────────────────────
export const POINTS = {
  /** Acierto exacto: 3-1 dijiste, 3-1 fue */
  EXACT_RESULT: 8,
  /** Acierto del ganador (sin score exacto) */
  WINNER_ONLY: 3,
  /** Acierto de empate sin score exacto */
  DRAW_ONLY: 1,
  /** Bonus: misma diferencia de gol, sumado al base si ganador correcto */
  DIFF_BONUS: 2,
  /** Predicción ausente / fuera de plazo */
  NONE: 0,
} as const;

// ─── Phase multipliers ──────────────────────────────────────────────
export const PHASE_MULTIPLIER: Record<Phase, number> = {
  groups: 1,
  "round-of-16": 2,
  quarter: 3,
  semi: 4,
  final: 5,
};

// ─── Special predictions (one-shot pre-torneo) ──────────────────────
export const SPECIAL_POINTS = {
  CHAMPION: 40,
  RUNNER_UP: 20,
  TOP_SCORER: 30,
  GROUP_STAGE_BEST: 15,
  REVELATION: 15,
} as const;

// ─── Consistency bonuses ────────────────────────────────────────────
export const BONUS = {
  /** Racha de 7 días seguidos prediciendo */
  STREAK_7_DAYS: 10,
  /** Cada bloque adicional de 7 días (14, 21, 28…) */
  STREAK_EXTRA_BLOCK: 15,
  /** Acertaste el ganador en todos los partidos de un grupo */
  GROUP_ALL_WINNERS: 5,
  /** Acertaste exactos en 3+ partidos del mismo grupo */
  GROUP_3_EXACTS: 10,
  /** Jornada perfecta: 4 partidos del día con ganador correcto */
  PERFECT_DAY: 8,
  /** Cargaste las 4 fases eliminatorias completas antes del cierre */
  KNOCKOUT_ALL_PRE_LOCK: 20,
  /** Pleno de un cruce eliminatorio (todos los partidos de octavos, etc.) */
  KNOCKOUT_ROUND_FULL: 25,
} as const;

// ─── Soft penalties ─────────────────────────────────────────────────
export const PENALTY = {
  /** Aplica al ranking SEMANAL solamente (no al global). Se descuenta si
   *  el user no cargó predicción en 3 o más partidos disponibles. */
  WEEKLY_INACTIVITY: 2,
} as const;

// ─── Validation bounds ──────────────────────────────────────────────
export const VALID = {
  MIN_SCORE: 0,
  MAX_SCORE: 20,
} as const;
