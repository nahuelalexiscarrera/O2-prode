/**
 * O2 PRODE — Levels (1-5)
 * Agente 11 · Gamification
 *
 * Level system with UI metadata. Pure logic lives in lib/ranking/compute.ts
 * (pointsToLevel). This module adds display helpers: color, glow, etc.
 */

import type { UserLevel } from "@/types/domain";

export interface LevelMeta {
  level: UserLevel;
  name: string;
  thresholdPoints: number;
  color: string;
  withGlow: boolean;
}

export const LEVELS: readonly LevelMeta[] = [
  { level: 1, name: "Rookie", thresholdPoints: 0, color: "var(--text-muted)", withGlow: false },
  {
    level: 2,
    name: "Aplicado",
    thresholdPoints: 51,
    color: "var(--primary-soft)",
    withGlow: false,
  },
  { level: 3, name: "Pro", thresholdPoints: 151, color: "var(--brand-primary)", withGlow: false },
  { level: 4, name: "Crack", thresholdPoints: 301, color: "var(--accent-lime)", withGlow: false },
  {
    level: 5,
    name: "Leyenda O2",
    thresholdPoints: 501,
    color: "var(--accent-lime)",
    withGlow: true,
  },
] as const;

export function getLevelMeta(level: UserLevel): LevelMeta {
  // Levels are 1-indexed; we know LEVELS has exactly 5 entries.
  const meta = LEVELS[level - 1];
  if (!meta) {
    // Defensive fallback — should never happen given the UserLevel union.
    return LEVELS[0]!;
  }
  return meta;
}

/**
 * Returns the next level meta (or null if at max). Used by progress UI:
 * "Te faltan 27 pts para Crack".
 */
export function getNextLevel(level: UserLevel): LevelMeta | null {
  if (level >= 5) return null;
  return LEVELS[level] ?? null;
}

/**
 * Returns points needed to reach the next level, or 0 if at max.
 */
export function pointsToNextLevel(currentPoints: number, currentLevel: UserLevel): number {
  const next = getNextLevel(currentLevel);
  if (!next) return 0;
  return Math.max(0, next.thresholdPoints - currentPoints);
}

/**
 * Progress to next level as percentage (0-100). Useful for ProgressBar in profile.
 */
export function levelProgressPercent(currentPoints: number, currentLevel: UserLevel): number {
  const current = getLevelMeta(currentLevel);
  const next = getNextLevel(currentLevel);
  if (!next) return 100; // Max level reached
  const span = next.thresholdPoints - current.thresholdPoints;
  const earned = currentPoints - current.thresholdPoints;
  return Math.min(100, Math.max(0, (earned / span) * 100));
}
