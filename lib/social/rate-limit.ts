/**
 * DB-based rate limiting for social actions.
 * Counts recent rows in Supabase — no external infra needed.
 *
 * Limits (deploy checklist):
 *   - Posts:     5  per user per hour
 *   - Comments: 30  per user per hour
 *   - Reactions: 60 per user per minute
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function checkPostRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("post")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since)
    .is("deleted_at", null);

  if ((count ?? 0) >= 5) {
    throw new RateLimitError(
      "Límite alcanzado. Podés publicar hasta 5 posts por hora."
    );
  }
}

export async function checkCommentRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("comment")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since)
    .is("deleted_at", null);

  if ((count ?? 0) >= 30) {
    throw new RateLimitError(
      "Límite alcanzado. Podés comentar hasta 30 veces por hora."
    );
  }
}

export async function checkReactionRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const since = new Date(Date.now() - 60 * 1000).toISOString();
  const { count } = await supabase
    .from("reaction")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if ((count ?? 0) >= 60) {
    throw new RateLimitError(
      "Demasiadas reacciones. Esperá un momento."
    );
  }
}
