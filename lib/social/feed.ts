/**
 * O2 PRODE — Feed helpers (pure functions)
 * Agente 10 · Social Feed
 *
 * Pure helpers for feed display: relative time, body truncation,
 * post grouping by date, etc.
 */

import type { Post, Comment, Reaction } from "@/types/domain";

// ─── Relative time formatter (es-AR) ─────────────────────────────────

/**
 * Returns "hace 10 min", "hace 1h", "hace 2d", etc.
 * Pure: deterministic given (now, then).
 */
export function timeAgo(then: string, now: Date = new Date()): string {
  const thenDate = new Date(then);
  const diffMs = now.getTime() - thenDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "ahora";
  if (diffSec < 60) return `hace ${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `hace ${diffHour}h`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `hace ${diffDay}d`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `hace ${diffWeek}sem`;

  // For older posts, fall back to absolute date (es-AR)
  return thenDate.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

// ─── Body truncation for preview ────────────────────────────────────

export function truncateBody(body: string, max = 140): string {
  if (body.length <= max) return body;
  return body.slice(0, max - 1).trimEnd() + "…";
}

// ─── Posts grouping by day (for archived view) ──────────────────────

export function groupByDay(posts: Post[]): Array<{ date: string; posts: Post[] }> {
  const groups = new Map<string, Post[]>();
  for (const p of posts) {
    const day = new Date(p.createdAt).toISOString().slice(0, 10);
    const existing = groups.get(day) ?? [];
    existing.push(p);
    groups.set(day, existing);
  }
  return Array.from(groups, ([date, posts]) => ({ date, posts }));
}

// ─── Optimistic insertion ───────────────────────────────────────────

/**
 * Inserts a placeholder post at the top of the list. Used for optimistic
 * UI when the user just hit "Publicar" but server hasn't confirmed yet.
 *
 * The placeholder has a temp id prefixed with "tmp-".
 */
export function optimisticPrependPost<P extends { id: string; createdAt: string }>(
  list: P[],
  placeholder: P
): P[] {
  return [placeholder, ...list];
}

/** Replaces a temp placeholder with the real saved post once server confirms. */
export function replacePlaceholder<P extends { id: string }>(
  list: P[],
  tempId: string,
  saved: P
): P[] {
  return list.map((item) => (item.id === tempId ? saved : item));
}

/** Removes a temp placeholder when server save fails. */
export function rollbackPlaceholder<P extends { id: string }>(list: P[], tempId: string): P[] {
  return list.filter((item) => item.id !== tempId);
}

// ─── Highlighting score (Destacados algorithm — reference only) ─────

/**
 * Computes a recency-weighted score for "Destacados".
 * Mirrors the SQL view formula for parity in tests / local sort.
 *
 *   score = (reactionCount + commentCount * 1.5) * exp(-ageHours / 24)
 */
export function destacadosScore(
  post: {
    reactionCount: number;
    commentCount: number;
    createdAt: string;
  },
  now: Date = new Date()
): number {
  const ageMs = now.getTime() - new Date(post.createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const recencyWeight = Math.exp(-ageHours / 24);
  return (post.reactionCount + post.commentCount * 1.5) * recencyWeight;
}
