/**
 * O2 PRODE — Bonus Points (consistency, streaks, perfect days)
 * Agente 9 · Game Logic
 */

import { BONUS, PENALTY } from "./rules";

// ─── Streak bonuses ─────────────────────────────────────────────────

/**
 * Returns total bonus points from a streak of N consecutive days
 * with predictions loaded.
 *
 * Rules:
 *  - First 7 days: +10
 *  - Each extra block of 7: +15
 *  - Less than 7: 0
 */
export function calculateStreakBonus(consecutiveDays: number): number {
  if (consecutiveDays < 7) return 0;
  const fullBlocks = Math.floor(consecutiveDays / 7);
  const baseBonus = BONUS.STREAK_7_DAYS;
  const extraBlocks = fullBlocks - 1;
  return baseBonus + extraBlocks * BONUS.STREAK_EXTRA_BLOCK;
}

// ─── Group completion bonuses ───────────────────────────────────────

export interface GroupCompletionInput {
  /** How many of the 6 group matches the user predicted */
  predictedCount: number;
  /** How many of those got winner correct */
  winnersCorrect: number;
  /** How many got exact result */
  exactsCorrect: number;
}

export function calculateGroupBonus(input: GroupCompletionInput): number {
  let bonus = 0;
  // All 6 winners correct
  if (input.predictedCount === 6 && input.winnersCorrect === 6) {
    bonus += BONUS.GROUP_ALL_WINNERS;
  }
  // 3 or more exacts
  if (input.exactsCorrect >= 3) {
    bonus += BONUS.GROUP_3_EXACTS;
  }
  return bonus;
}

// ─── Perfect day ────────────────────────────────────────────────────

/**
 * Perfect day: 4 matches of the same day, all winners correctly predicted.
 */
export function calculatePerfectDayBonus(input: {
  matchesPlayed: number;
  winnersCorrect: number;
}): number {
  if (input.matchesPlayed === 4 && input.winnersCorrect === 4) {
    return BONUS.PERFECT_DAY;
  }
  return 0;
}

// ─── Knockout pre-load bonus ────────────────────────────────────────

/** All 4 knockout phases predicted before their respective locks. */
export function calculateKnockoutPreloadBonus(allFourLoaded: boolean): number {
  return allFourLoaded ? BONUS.KNOCKOUT_ALL_PRE_LOCK : 0;
}

/** Pleno: all matches of a single knockout round correctly winners. */
export function calculateKnockoutRoundFullBonus(input: {
  roundMatches: number;
  winnersCorrect: number;
}): number {
  if (input.roundMatches > 0 && input.winnersCorrect === input.roundMatches) {
    return BONUS.KNOCKOUT_ROUND_FULL;
  }
  return 0;
}

// ─── Weekly inactivity penalty ──────────────────────────────────────

/**
 * Applied to WEEKLY ranking only (not global).
 * Triggers when user missed >=3 matches in the week.
 */
export function calculateInactivityPenalty(input: {
  missedMatchesInWeek: number;
}): number {
  return input.missedMatchesInWeek >= 3 ? -PENALTY.WEEKLY_INACTIVITY : 0;
}
