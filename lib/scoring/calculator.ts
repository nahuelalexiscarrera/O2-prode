/**
 * O2 PRODE — Match Points Calculator (pure function)
 * Agente 9 · Game Logic
 *
 * Calculates the score for a single match prediction.
 * 100% deterministic, no side effects, no async.
 */

import type { Phase, PointsBreakdown } from "@/types/domain";
import { POINTS, PHASE_MULTIPLIER, VALID } from "./rules";

export interface MatchPredictionInput {
  homeScore: number;
  awayScore: number;
}

export interface MatchResultInput {
  homeScore: number;
  awayScore: number;
}

export interface CalculateMatchPointsParams {
  prediction: MatchPredictionInput;
  result: MatchResultInput;
  phase: Phase;
}

export class InvalidScoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidScoreError";
  }
}

export class UnknownPhaseError extends Error {
  constructor(phase: string) {
    super(`Unknown phase: ${phase}`);
    this.name = "UnknownPhaseError";
  }
}

function validateScore(label: string, value: number): void {
  if (!Number.isInteger(value)) {
    throw new InvalidScoreError(`${label} must be integer, got ${value}`);
  }
  if (value < VALID.MIN_SCORE || value > VALID.MAX_SCORE) {
    throw new InvalidScoreError(
      `${label} out of range [${VALID.MIN_SCORE}, ${VALID.MAX_SCORE}], got ${value}`
    );
  }
}

/**
 * Core scoring function. Returns full breakdown for transparency.
 *
 * Rules (Agente 2 §7):
 *  - Exact result: 8 pts
 *  - Winner only:  3 pts
 *  - Draw only:    1 pt
 *  - Diff bonus:  +2 pts (only when winner is correct or draw)
 *  - Phase multiplier: x1/x2/x3/x4/x5
 */
export function calculateMatchPoints(params: CalculateMatchPointsParams): PointsBreakdown {
  const { prediction, result, phase } = params;

  // Validation
  validateScore("prediction.homeScore", prediction.homeScore);
  validateScore("prediction.awayScore", prediction.awayScore);
  validateScore("result.homeScore", result.homeScore);
  validateScore("result.awayScore", result.awayScore);

  const multiplier = PHASE_MULTIPLIER[phase];
  if (multiplier === undefined) {
    throw new UnknownPhaseError(phase);
  }

  let exactResult = 0;
  let winnerCorrect = 0;
  let drawCorrect = 0;
  let diffBonus = 0;

  const isExact =
    prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore;

  if (isExact) {
    exactResult = POINTS.EXACT_RESULT;
  } else {
    const predictedWinner = Math.sign(prediction.homeScore - prediction.awayScore);
    const actualWinner = Math.sign(result.homeScore - result.awayScore);

    if (predictedWinner === actualWinner) {
      if (actualWinner === 0) {
        // Draw without exact
        drawCorrect = POINTS.DRAW_ONLY;
      } else {
        winnerCorrect = POINTS.WINNER_ONLY;
      }

      // Diff bonus applies only when winner direction is correct
      const predictedDiff = prediction.homeScore - prediction.awayScore;
      const actualDiff = result.homeScore - result.awayScore;
      if (predictedDiff === actualDiff) {
        diffBonus = POINTS.DIFF_BONUS;
      }
    }
  }

  const base = exactResult + winnerCorrect + drawCorrect + diffBonus;
  const total = base * multiplier;

  return {
    exactResult,
    winnerCorrect,
    drawCorrect,
    diffBonus,
    phaseMultiplier: multiplier,
    total,
  };
}
