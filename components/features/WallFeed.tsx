"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PostCardFull } from "@/components/features/PostCardFull";
import { PostComposer } from "@/components/features/PostComposer";
import { timeAgo as formatTimeAgo } from "@/lib/social/feed";
import { cn } from "@/lib/utils/cn";
import type { FeedPost } from "@/lib/social/types";
import type { UserLevel } from "@/types/domain";

interface WallFeedProps {
  initialPosts: FeedPost[];
  myUserId: string;
  myReactedIds: string[];
  myName: string;
  myInitials: string;
  myAvatarUrl: string | null;
  myLevel: UserLevel;
  activeTab: "recientes" | "destacados";
}

export function WallFeed({
  initialPosts,
  myUserId,
  myReactedIds,
  myName,
  myInitials,
  myAvatarUrl,
  myLevel,
  activeTab,
}: WallFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [reactedIds, setReactedIds] = useState(new Set(myReactedIds));
  const [newPostCount, setNewPostCount] = useState(0);
  const router = useRouter();
  const now = new Date();
  const tabRecientesRef = useRef<HTMLAnchorElement>(null);
  const tabDestacadosRef = useRef<HTMLAnchorElement>(null);

  function handleTabKeyDown(
    e: React.KeyboardEvent,
    current: "recientes" | "destacados"
  ) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (current === "recientes") tabDestacadosRef.current?.focus();
      else tabRecientesRef.current?.focus();
    }
  }

  // Sync when server re-renders after router.refresh() or tab switch
  useEffect(() => {
    setPosts(initialPosts);
    setReactedIds(new Set(myReactedIds));
    setNewPostCount(0);
  }, [initialPosts, myReactedIds]);

  // Realtime: new post notifications (Recientes only)
  useEffect(() => {
    if (activeTab !== "recientes") return;
    const sinceISO = initialPosts[0]?.created_at ?? new Date().toISOString();
    const supabase = createClient();

    const channel = supabase
      .channel("wall-new-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post" },
        (payload) => {
          const row = payload.new as { created_at: string; user_id: string };
          // Don't count our own posts (already prepended optimistically)
          if (row.user_id === myUserId) return;
          if (new Date(row.created_at) > new Date(sinceISO)) {
            setNewPostCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [activeTab, initialPosts, myUserId]);

  function handleNewPost(post: FeedPost) {
    setPosts((prev) => [post, ...prev]);
    setReactedIds((prev) => prev); // no change
  }

  function handleLoadNew() {
    setNewPostCount(0);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-6">
      {/* Tabs */}
      <div role="tablist" aria-label="Modo del feed" className="flex gap-1">
        <Link
          ref={tabRecientesRef}
          id="tab-recientes"
          href="/app/muro"
          role="tab"
          aria-selected={activeTab === "recientes"}
          onKeyDown={(e) => handleTabKeyDown(e, "recientes")}
          className={cn(
            "flex-1 flex items-center justify-center h-10 rounded-xl",
            "text-body-sm font-semibold transition-colors",
            activeTab === "recientes"
              ? "bg-primary/10 text-primary"
              : "text-text-muted hover:text-text"
          )}
        >
          Recientes
        </Link>
        <Link
          ref={tabDestacadosRef}
          id="tab-destacados"
          href="/app/muro?tab=destacados"
          role="tab"
          aria-selected={activeTab === "destacados"}
          onKeyDown={(e) => handleTabKeyDown(e, "destacados")}
          className={cn(
            "flex-1 flex items-center justify-center h-10 rounded-xl",
            "text-body-sm font-semibold transition-colors",
            activeTab === "destacados"
              ? "bg-primary/10 text-primary"
              : "text-text-muted hover:text-text"
          )}
        >
          Destacados
        </Link>
      </div>

      {/* Tab panel */}
      <div
        role="tabpanel"
        aria-labelledby={activeTab === "recientes" ? "tab-recientes" : "tab-destacados"}
        className="flex flex-col gap-4"
      >
        {/* Compose (Recientes only) */}
        {activeTab === "recientes" && (
          <PostComposer
            myUserId={myUserId}
            myName={myName}
            myInitials={myInitials}
            myAvatarUrl={myAvatarUrl}
            myLevel={myLevel}
            onPost={handleNewPost}
          />
        )}

        {/* New posts banner */}
        {newPostCount > 0 && (
          <button
            type="button"
            onClick={handleLoadNew}
            className={cn(
              "bg-primary/10 text-primary text-body-sm font-semibold",
              "rounded-xl py-3 text-center transition-colors hover:bg-primary/20"
            )}
          >
            {newPostCount === 1 ? "1 post nuevo" : `${newPostCount} posts nuevos`} — Tocá para
            cargar
          </button>
        )}

        {/* Feed */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body-sm text-text-muted">
              {activeTab === "destacados"
                ? "Todavía no hay posts destacados. ¡Publicá algo!"
                : "Todavía no hay publicaciones. ¡Sé el primero!"}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCardFull
              key={post.id}
              postId={post.id}
              authorId={post.author?.id ?? ""}
              authorName={post.author?.name ?? "Socio"}
              authorInitials={post.author?.initials ?? "S"}
              authorAvatarUrl={post.author?.avatar_url ?? null}
              authorLevel={Number(post.author?.level ?? 1) as UserLevel}
              body={post.body}
              imageUrl={post.image_url}
              imageWidth={post.image_width}
              imageHeight={post.image_height}
              reactionCount={post.reaction_count}
              commentCount={post.comment_count}
              myReacted={reactedIds.has(post.id)}
              myUserId={myUserId}
              timeAgo={formatTimeAgo(post.created_at, now)}
            />
          ))
        )}
      </div>
    </div>
  );
}
