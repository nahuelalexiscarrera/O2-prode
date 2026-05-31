"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { processAchievements } from "@/lib/achievements/actions";
import {
  checkPostRateLimit,
  checkCommentRateLimit,
  checkReactionRateLimit,
} from "@/lib/social/rate-limit";
import type { TriggerContext } from "@/lib/achievements/triggers";
import type { UnlockedAchievement } from "@/components/features/AchievementModal";

// ─── Schemas ──────────────────────────────────────────────────────────

const postSchema = z.object({
  body: z.string().min(1).max(280),
  embedType: z.enum(["prediction", "match"]).optional(),
  embedRefId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  imageWidth: z.number().int().positive().max(8000).optional(),
  imageHeight: z.number().int().positive().max(8000).optional(),
});

const reactionSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().uuid(),
});

const commentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(280),
});

export type CreatePostInput = z.infer<typeof postSchema>;
export type ToggleReactionInput = z.infer<typeof reactionSchema>;
export type CreateCommentInput = z.infer<typeof commentSchema>;

// ─── Row types (shape returned by Supabase selects) ───────────────────

export type PostRow = {
  id: string;
  user_id: string;
  body: string | null;
  embed_type: string | null;
  embed_ref_id: string | null;
  image_url: string | null;
  image_width: number | null;
  image_height: number | null;
  reaction_count: number;
  comment_count: number;
  created_at: string;
};

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string | null;
  reaction_count: number;
  created_at: string;
};

// ─── Auth helper ──────────────────────────────────────────────────────

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return { supabase, user };
}

// ─── Social stats for achievement evaluation ──────────────────────────

async function fetchSocialStats(userId: string) {
  const supabase = await createClient();

  const [postsRes, commentsRes] = await Promise.all([
    supabase.from("post").select("reaction_count").eq("user_id", userId).is("deleted_at", null),
    supabase.from("comment").select("post_id").eq("user_id", userId).is("deleted_at", null),
  ]);

  const posts = postsRes.data ?? [];
  const comments = commentsRes.data ?? [];

  return {
    postsCount: posts.length,
    bestPostReactions: posts.reduce((max, p) => Math.max(max, p.reaction_count ?? 0), 0),
    distinctPostsCommented: new Set(comments.map((c) => c.post_id)).size,
  };
}

function buildSocialCtx(
  userId: string,
  postsCount: number,
  bestPostReactions: number,
  distinctCommentedCount: number
): TriggerContext {
  return {
    userId,
    exactStreak: 0,
    streakDays: 0,
    tournamentCompletionPercent: 0,
    loadedGroupFirstDay: false,
    groups: [],
    knockoutRounds: [],
    upsets: { upsetsCorrect: 0 },
    position: 0,
    weeklyPositionDelta: 0,
    postsCount,
    bestPostReactions,
    commentsMadeOnDistinctPostsCount: distinctCommentedCount,
    externalSharesCount: 0,
    activatedFriendsCount: 0,
    predictedChampionCode: null,
    actualChampionCode: null,
    tournamentEnded: false,
    tournamentWinnerUserId: null,
  };
}

async function evalSocialAchievements(userId: string): Promise<UnlockedAchievement[]> {
  try {
    const stats = await fetchSocialStats(userId);
    const ctx = buildSocialCtx(
      userId,
      stats.postsCount,
      stats.bestPostReactions,
      stats.distinctPostsCommented
    );
    return await processAchievements("social", ctx);
  } catch {
    // Achievement errors must never break the main action
    return [];
  }
}

// ─── Actions ──────────────────────────────────────────────────────────

export async function createPost(
  input: CreatePostInput
): Promise<{ post: PostRow; unlockedAchievements: UnlockedAchievement[] }> {
  const parsed = postSchema.parse(input);
  const { supabase, user } = await requireUser();

  await checkPostRateLimit(supabase, user.id);

  const { data, error } = await supabase
    .from("post")
    .insert({
      user_id: user.id,
      body: parsed.body,
      embed_type: parsed.embedType ?? null,
      embed_ref_id: parsed.embedRefId ?? null,
      image_url: parsed.imageUrl ?? null,
      image_width: parsed.imageWidth ?? null,
      image_height: parsed.imageHeight ?? null,
    })
    .select(
      "id, user_id, body, embed_type, embed_ref_id, image_url, image_width, image_height, reaction_count, comment_count, created_at"
    )
    .single();

  if (error) throw error;
  revalidateTag("feed-recientes");

  const unlockedAchievements = await evalSocialAchievements(user.id);
  return { post: data as PostRow, unlockedAchievements };
}

export async function toggleReaction(input: ToggleReactionInput) {
  const parsed = reactionSchema.parse(input);
  const { supabase, user } = await requireUser();

  await checkReactionRateLimit(supabase, user.id);

  const { data: existing } = await supabase
    .from("reaction")
    .select("user_id")
    .match({ target_type: parsed.targetType, target_id: parsed.targetId, user_id: user.id })
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("reaction").delete().match({
      target_type: parsed.targetType,
      target_id: parsed.targetId,
      user_id: user.id,
    });
    if (error) throw error;
    revalidateTag("feed-recientes");
    return { reacted: false };
  }

  const { error } = await supabase.from("reaction").insert({
    target_type: parsed.targetType,
    target_id: parsed.targetId,
    user_id: user.id,
  });
  if (error) throw error;
  revalidateTag("feed-recientes");
  return { reacted: true };
}

export async function createComment(
  input: CreateCommentInput
): Promise<{ comment: CommentRow; unlockedAchievements: UnlockedAchievement[] }> {
  const parsed = commentSchema.parse(input);
  const { supabase, user } = await requireUser();

  await checkCommentRateLimit(supabase, user.id);

  const { data, error } = await supabase
    .from("comment")
    .insert({ post_id: parsed.postId, user_id: user.id, body: parsed.body })
    .select("id, post_id, user_id, body, reaction_count, created_at")
    .single();

  if (error) throw error;
  // El trigger de DB ya incrementó post.comment_count; refrescamos el feed
  // para que el contador no quede stale al volver al muro.
  revalidateTag("feed-recientes");

  const unlockedAchievements = await evalSocialAchievements(user.id);
  return { comment: data as CommentRow, unlockedAchievements };
}

export async function deletePost(postId: string) {
  const { supabase } = await requireUser();
  // No filtramos por user_id: la RLS ("Borra post: dueño o admin") decide quién
  // puede. Si no puede, el UPDATE no afecta filas → lo tratamos como prohibido.
  const { data, error } = await supabase
    .from("post")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("FORBIDDEN");
  revalidateTag("feed-recientes");
}

export async function deleteComment(commentId: string) {
  const { supabase } = await requireUser();
  // RLS ("Borra comentario: dueño o admin") decide; soft-delete vía deleted_at.
  const { data, error } = await supabase
    .from("comment")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("FORBIDDEN");
  revalidateTag("feed-recientes");
}
