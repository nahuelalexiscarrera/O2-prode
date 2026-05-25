/**
 * O2 PRODE — Achievements · Public API
 * Agente 11 · Gamification
 */

export {
  ACHIEVEMENTS,
  ACHIEVEMENT_BY_ID,
  ACHIEVEMENT_BY_TRIGGER,
  getAchievement,
  getAchievementsByCategory,
  type AchievementDef,
  type AchievementImpact,
} from "./catalog";

export {
  evaluateAchievements,
  evaluateForEvent,
  type TriggerContext,
  type EvaluationResult,
  type EventScope,
  type GroupCompletionSummary,
  type KnockoutRoundSummary,
  type UpsetSummary,
} from "./triggers";

export {
  LEVELS,
  getLevelMeta,
  getNextLevel,
  pointsToNextLevel,
  levelProgressPercent,
  type LevelMeta,
} from "./levels";
