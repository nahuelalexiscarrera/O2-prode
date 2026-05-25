/**
 * O2 PRODE — Ranking Compute
 * Agente 9 · Game Logic
 *
 * Pure functions to compute ranking from a list of users with points.
 * The DB has its own `fn_recalculate_positions` (Agente 8) — these
 * helpers are for client-side preview, tests and dev mocks.
 */

import type { RankingEntry, User, UserLevel } from "@/types/domain";

interface RankableUser {
  id: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  level: UserLevel;
  points: number;
  joinedAt: string;
}

/**
 * Computes a ranking from a list of users.
 *
 * Tiebreak rules:
 *  1. Higher total points
 *  2. Earlier joinedAt (loyalty bonus on equality)
 */
export function computeRanking(users: RankableUser[]): RankingEntry[] {
  const sorted = [...users].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.joinedAt.localeCompare(b.joinedAt);
  });

  return sorted.map((u, idx) => ({
    position: idx + 1,
    userId: u.id,
    userName: u.name,
    userInitials: u.initials,
    avatarUrl: u.avatarUrl,
    level: u.level,
    points: u.points,
    delta: 0,
  }));
}

/**
 * Diffs two ranking snapshots and produces entries with delta from previous.
 * Positive delta = subió. Negative = bajó.
 */
export function diffRanking(current: RankingEntry[], previous: RankingEntry[]): RankingEntry[] {
  const prevMap = new Map(previous.map((e) => [e.userId, e.position]));
  return current.map((entry) => {
    const prevPos = prevMap.get(entry.userId);
    if (prevPos === undefined) {
      return { ...entry, delta: 0 };
    }
    // If prev #10 and now #5 → delta +5 (subió 5)
    return { ...entry, delta: prevPos - entry.position };
  });
}

/**
 * Returns a slice of the ranking centered around a given user position.
 * Used by the Ranking screen's "context window" display (±5 around me).
 */
export function rankingContextWindow(
  ranking: RankingEntry[],
  centerUserId: string,
  windowSize = 5
): RankingEntry[] {
  const idx = ranking.findIndex((e) => e.userId === centerUserId);
  if (idx === -1) return [];
  const start = Math.max(0, idx - windowSize);
  const end = Math.min(ranking.length, idx + windowSize + 1);
  return ranking.slice(start, end);
}

/**
 * Computes the level (1-5) and its display name for a given point total.
 * Thresholds defined in Agente 2 §10.4.
 */
export function pointsToLevel(points: number): { level: UserLevel; levelName: string } {
  if (points >= 501) return { level: 5, levelName: "Leyenda O2" };
  if (points >= 301) return { level: 4, levelName: "Crack" };
  if (points >= 151) return { level: 3, levelName: "Pro" };
  if (points >= 51) return { level: 2, levelName: "Aplicado" };
  return { level: 1, levelName: "Rookie" };
}
