/**
 * O2 PRODE — Special Predictions (one-shot pre-torneo)
 * Agente 9 · Game Logic
 *
 * Champion, runner-up, top scorer, group-stage best, revelation team.
 * Settled once at tournament end.
 */

import { SPECIAL_POINTS } from "./rules";

export interface SpecialPredictionInput {
  championCode: string;
  runnerUpCode: string;
  topScorerPlayerId: string;
  groupStageBestCode: string;
  revelationCode: string;
}

export interface SpecialActualInput {
  championCode: string;
  runnerUpCode: string;
  topScorerPlayerId: string;
  groupStageBestCode: string;
  revelationCode: string;
}

export interface SpecialBreakdown {
  champion: number;
  runnerUp: number;
  topScorer: number;
  groupStageBest: number;
  revelation: number;
  total: number;
}

export function calculateSpecialPoints(params: {
  prediction: SpecialPredictionInput;
  actual: SpecialActualInput;
}): SpecialBreakdown {
  const { prediction, actual } = params;

  const champion = prediction.championCode === actual.championCode ? SPECIAL_POINTS.CHAMPION : 0;

  const runnerUp = prediction.runnerUpCode === actual.runnerUpCode ? SPECIAL_POINTS.RUNNER_UP : 0;

  const topScorer =
    prediction.topScorerPlayerId === actual.topScorerPlayerId ? SPECIAL_POINTS.TOP_SCORER : 0;

  const groupStageBest =
    prediction.groupStageBestCode === actual.groupStageBestCode
      ? SPECIAL_POINTS.GROUP_STAGE_BEST
      : 0;

  const revelation =
    prediction.revelationCode === actual.revelationCode ? SPECIAL_POINTS.REVELATION : 0;

  return {
    champion,
    runnerUp,
    topScorer,
    groupStageBest,
    revelation,
    total: champion + runnerUp + topScorer + groupStageBest + revelation,
  };
}
