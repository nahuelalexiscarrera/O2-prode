"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DbComment } from "@/lib/social/types";

// ─── New post notifier (banner "N posts nuevos") ──────────────────────

export function useNewPostsBanner(sinceISO: string, myUserId: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("wall-new-posts-banner")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post" },
        (payload) => {
          const row = payload.new as { created_at: string; user_id: string };
          if (row.user_id === myUserId) return;
          if (new Date(row.created_at) > new Date(sinceISO)) {
            setCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sinceISO, myUserId]);

  return { count, reset: () => setCount(0) };
}

// ─── Live reaction count for a single post ────────────────────────────

export function usePostReactionCount(postId: string, initialCount: number) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`post-${postId}-reactions`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "post", filter: `id=eq.${postId}` },
        (payload) => {
          const row = payload.new as { reaction_count: number };
          setCount(row.reaction_count);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [postId]);

  return count;
}

// ─── Live comment stream for post detail ─────────────────────────────

export function usePostCommentsStream(postId: string, initial: DbComment[]) {
  const [comments, setComments] = useState<DbComment[]>(initial);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`post-${postId}-comments`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comment", filter: `post_id=eq.${postId}` },
        (payload) => {
          const row = payload.new as {
            id: string;
            post_id: string;
            user_id: string;
            body: string;
            reaction_count: number;
            created_at: string;
          };
          setComments((cs) => {
            if (cs.some((c) => c.id === row.id)) return cs;
            return [
              ...cs,
              {
                id: row.id,
                post_id: row.post_id,
                user_id: row.user_id,
                body: row.body,
                reaction_count: row.reaction_count,
                created_at: row.created_at,
                author: null,
              },
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "comment", filter: `post_id=eq.${postId}` },
        (payload) => {
          const row = payload.new as { id: string; deleted_at: string | null };
          if (row.deleted_at) {
            setComments((cs) => cs.filter((c) => c.id !== row.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [postId]);

  return { comments, setComments };
}
