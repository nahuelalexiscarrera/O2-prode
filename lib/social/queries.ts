/**
 * O2 PRODE — Social Feed · Server Queries
 * Agente 10 · Social Feed
 *
 * Server-side data fetching for the wall. Use from Server Components.
 */

import { createClient } from "@/lib/supabase/server";
import { pointsToLevel } from "@/lib/ranking/compute";

const POST_WITH_AUTHOR = `
  id, user_id, body, embed_type, embed_ref_id,
  image_url, image_width, image_height,
  reaction_count, comment_count, created_at,
  author:user!user_id ( id, name, initials, avatar_url, level, total_points )
` as const;

const COMMENT_WITH_AUTHOR = `
  id, post_id, user_id, body, reaction_count, created_at,
  author:user!user_id ( id, name, initials, avatar_url, level, total_points )
` as const;

// El nivel del autor se DERIVA de sus puntos (user.level está estancada en 1).
// Así el badge de nivel en el muro/comentarios coincide con ranking/perfil/share.
type RowWithAuthor = { author: { total_points?: number | null } | null } & Record<string, unknown>;
function withAuthorLevel<T>(rows: T[]): T[] {
  return rows.map((row) => {
    const r = row as RowWithAuthor;
    if (!r.author) return row;
    return {
      ...r,
      author: { ...r.author, level: pointsToLevel(r.author.total_points ?? 0).level },
    } as T;
  });
}
function withAuthorLevelOne<T>(row: T): T {
  return withAuthorLevel([row])[0] as T;
}

// ─── Feed: Recientes (cursor pagination) ─────────────────────────────

export interface FeedRecientesOptions {
  limit?: number;
  cursorCreatedAt?: string;
}

export async function getFeedRecientes(opts: FeedRecientesOptions = {}) {
  const supabase = await createClient();
  const limit = opts.limit ?? 20;

  let query = supabase
    .from("post")
    .select(POST_WITH_AUTHOR)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.cursorCreatedAt) {
    query = query.lt("created_at", opts.cursorCreatedAt);
  }

  const { data, error } = await query;
  if (error) throw error;
  return withAuthorLevel(data ?? []);
}

// ─── Feed: Destacados (score = reactions + comments*1.5, últimas 48h) ─

export async function getFeedDestacados(limit = 20) {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from("post")
    .select(POST_WITH_AUTHOR)
    .is("deleted_at", null)
    .gte("created_at", cutoff)
    .order("reaction_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return withAuthorLevel(data ?? []);
}

// ─── Post detail ─────────────────────────────────────────────────────

export async function getPostDetail(postId: string) {
  const supabase = await createClient();

  const [postRes, commentsRes] = await Promise.all([
    supabase.from("post").select(POST_WITH_AUTHOR).eq("id", postId).single(),
    supabase
      .from("comment")
      .select(COMMENT_WITH_AUTHOR)
      .eq("post_id", postId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
  ]);

  if (postRes.error) throw postRes.error;
  if (commentsRes.error) throw commentsRes.error;

  return {
    post: withAuthorLevelOne(postRes.data),
    comments: withAuthorLevel(commentsRes.data ?? []),
  };
}

// ─── My reactions (batch check by target type) ───────────────────────

async function getMyReactions(
  targetType: "post" | "comment",
  targetIds: string[]
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set<string>();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set<string>();

  const { data, error } = await supabase
    .from("reaction")
    .select("target_id")
    .eq("target_type", targetType)
    .eq("user_id", user.id)
    .in("target_id", targetIds);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.target_id));
}

export function getMyReactionsForPosts(postIds: string[]) {
  return getMyReactions("post", postIds);
}

export function getMyReactionsForComments(commentIds: string[]) {
  return getMyReactions("comment", commentIds);
}
