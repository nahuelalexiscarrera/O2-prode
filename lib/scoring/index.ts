/**
 * O2 PRODE — Scoring · Public API
 * Agente 9 · Game Logic
 */

export {
  calculateMatchPoints,
  InvalidScoreError,
  UnknownPhaseError,
  type CalculateMatchPointsParams,
  type MatchPredictionInput,
  type MatchResultInput,
} from "./calculator";

export {
  calculateSpecialPoints,
  type SpecialPredictionInput,
  type SpecialActualInput,
  type SpecialBreakdown,
} from "./specials";

export {
  calculateStreakBonus,
  calculateGroupBonus,
  calculatePerfectDayBonus,
  calculateKnockoutPreloadBonus,
  calculateKnockoutRoundFullBonus,
  calculateInactivityPenalty,
  type GroupCompletionInput,
} from "./bonuses";

export { POINTS, PHASE_MULTIPLIER, SPECIAL_POINTS, BONUS, PENALTY } from "./rules";
