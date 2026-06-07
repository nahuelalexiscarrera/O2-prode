"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { pointsToLevel } from "@/lib/ranking/compute";
import type { AuthorRow, DbComment } from "@/lib/social/types";

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

/** Trae los datos públicos del autor de un comentario (para no mostrar "Socio"). */
async function fetchCommentAuthor(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<AuthorRow | null> {
  const { data } = await supabase
    .from("user")
    .select("id, name, initials, avatar_url, total_points")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  const row = data as {
    id: string;
    name: string;
    initials: string;
    avatar_url: string | null;
    total_points: number | null;
  };
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    avatar_url: row.avatar_url ?? null,
    level: String(pointsToLevel(row.total_points ?? 0).level),
  };
}

export function usePostCommentsStream(postId: string, initial: DbComment[]) {
  const [comments, setComments] = useState<DbComment[]>(initial);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`post-${postId}-comments`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
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
          // Traemos el autor para no renderizar "Socio" (B5). Patcheamos también
          // el comentario propio que se agregó optimista con author: null.
          void fetchCommentAuthor(supabase, row.user_id).then((author) => {
            setComments((cs) => {
              const existing = cs.find((c) => c.id === row.id);
              if (existing) {
                if (existing.author) return cs;
                return cs.map((c) => (c.id === row.id ? { ...c, author } : c));
              }
              return [
                ...cs,
                {
                  id: row.id,
                  post_id: row.post_id,
                  user_id: row.user_id,
                  body: row.body,
                  reaction_count: row.reaction_count,
                  created_at: row.created_at,
                  author,
                },
              ];
            });
          });
        }
      )
      // El soft-delete setea deleted_at → la fila deja de pasar la policy SELECT,
      // así que Realtime NO entrega ese UPDATE a los clientes. Propagamos el
      // borrado por broadcast (pub/sub, sin RLS) desde el cliente que borra.
      .on("broadcast", { event: "comment_deleted" }, (msg) => {
        const { id } = (msg.payload ?? {}) as { id?: string };
        if (id) setComments((cs) => cs.filter((c) => c.id !== id));
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [postId]);

  /** Avisa a los demás viewers que un comentario fue borrado (ver nota arriba). */
  const broadcastDeleted = useCallback((commentId: string) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "comment_deleted",
      payload: { id: commentId },
    });
  }, []);

  return { comments, setComments, broadcastDeleted };
}
