"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createComment, toggleReaction, deleteComment } from "@/lib/social/actions";
import { AchievementModal, type UnlockedAchievement } from "@/components/features/AchievementModal";
import { timeAgo as formatTimeAgo } from "@/lib/social/feed";
import { usePostCommentsStream } from "@/lib/social/realtime";
import { cn } from "@/lib/utils/cn";
import type { DbComment } from "@/lib/social/types";
import type { UserLevel } from "@/types/domain";

interface CommentThreadProps {
  postId: string;
  initialComments: DbComment[];
  commentReactedIds: string[];
  myUserId: string;
  isAdmin?: boolean;
}

export function CommentThread({
  postId,
  initialComments,
  commentReactedIds,
  myUserId,
  isAdmin = false,
}: CommentThreadProps) {
  const { comments, setComments } = usePostCommentsStream(postId, initialComments);
  const [reactedIds, setReactedIds] = useState(new Set(commentReactedIds));
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<UnlockedAchievement[]>([]);
  const { toast } = useToast();
  const now = new Date();

  async function handleDelete(commentId: string) {
    const removed = comments.find((c) => c.id === commentId);
    setMenuFor(null);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await deleteComment(commentId);
    } catch {
      if (removed) {
        setComments((prev) =>
          [...prev, removed].sort((a, b) => a.created_at.localeCompare(b.created_at))
        );
      }
      toast({ variant: "error", message: "No se pudo eliminar el comentario" });
    }
  }

  async function handleToggleReaction(commentId: string) {
    const wasReacted = reactedIds.has(commentId);
    setReactedIds((prev) => {
      const next = new Set(prev);
      wasReacted ? next.delete(commentId) : next.add(commentId);
      return next;
    });
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, reaction_count: c.reaction_count + (wasReacted ? -1 : 1) }
          : c
      )
    );
    try {
      await toggleReaction({ targetType: "comment", targetId: commentId });
    } catch {
      // revert
      setReactedIds((prev) => {
        const next = new Set(prev);
        wasReacted ? next.add(commentId) : next.delete(commentId);
        return next;
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, reaction_count: c.reaction_count + (wasReacted ? 1 : -1) }
            : c
        )
      );
      toast({ variant: "error", message: "No se pudo guardar tu reacción" });
    }
  }

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      const { comment: saved, unlockedAchievements } = await createComment({ postId, body: trimmed });
      setComments((prev) => [
        ...prev,
        {
          id: saved.id,
          post_id: saved.post_id,
          user_id: saved.user_id,
          body: saved.body ?? "",
          reaction_count: saved.reaction_count,
          created_at: saved.created_at,
          author: null,
        },
      ]);
      if (unlockedAchievements.length > 0) setAchievements(unlockedAchievements);
      setBody("");
    } catch {
      toast({ variant: "error", message: "No se pudo publicar el comentario" });
    } finally {
      setPosting(false);
    }
  }

  const charCount = body.length;

  return (
    <>
    {achievements.length > 0 && (
      <AchievementModal
        achievements={achievements}
        userId={myUserId}
        onClose={() => setAchievements([])}
      />
    )}
    <div className="flex flex-col gap-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
        Comentarios ({comments.length})
      </span>

      {/* Comment list */}
      {comments.length > 0 ? (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => {
            const isReacted = reactedIds.has(comment.id);
            const level = Number(comment.author?.level ?? 1) as UserLevel;

            return (
              <div
                key={comment.id}
                className="flex gap-3 bg-card rounded-xl border border-border p-4"
              >
                <Avatar
                  name={comment.author?.name ?? "Socio"}
                  initials={comment.author?.initials ?? "S"}
                  avatarUrl={comment.author?.avatar_url ?? null}
                  size="xs"
                  levelBadge={level}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-body-sm font-semibold text-text">
                      {comment.author?.name ?? "Socio"}
                    </span>
                    <span className="text-[10px] text-text-secondary">
                      {formatTimeAgo(comment.created_at, now)}
                    </span>
                  </div>
                  <p className="text-body-sm text-text mt-0.5 leading-relaxed">
                    {comment.body}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleToggleReaction(comment.id)}
                    className={cn(
                      "flex items-center gap-1 mt-2 text-[11px] font-semibold transition-colors",
                      isReacted ? "text-error" : "text-text-muted hover:text-error"
                    )}
                    aria-pressed={isReacted}
                    aria-label={isReacted ? "Quitar reacción" : "Reaccionar"}
                  >
                    <Icon name={isReacted ? "heart-filled" : "heart"} size={13} />
                    <span>{comment.reaction_count}</span>
                  </button>
                </div>
                {(comment.user_id === myUserId || isAdmin) && (
                  <IconButton
                    icon="more"
                    label="Opciones del comentario"
                    size="sm"
                    variant="ghost"
                    onClick={() => setMenuFor(comment.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-body-sm text-text-muted text-center py-4">
          Sé el primero en comentar
        </p>
      )}

      {/* Compose */}
      <div className="flex flex-col gap-2 bg-card rounded-xl border border-border p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribí un comentario..."
          maxLength={280}
          rows={2}
          disabled={posting}
          className="w-full bg-transparent text-body-sm text-text placeholder:text-text-muted resize-none outline-none"
        />
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span
            className={cn(
              "text-[11px]",
              charCount > 260 ? "text-warning" : "text-text-muted"
            )}
          >
            {charCount}/280
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!body.trim()}
            loading={posting}
          >
            Comentar
          </Button>
        </div>
      </div>
    </div>

    <BottomSheet open={menuFor !== null} onClose={() => setMenuFor(null)} title="Comentario">
      <div className="flex flex-col gap-3 px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <Button
          variant="danger"
          fullWidth
          leftIcon="x-mark"
          onClick={() => menuFor && handleDelete(menuFor)}
        >
          Eliminar comentario
        </Button>
        <Button variant="ghost" fullWidth onClick={() => setMenuFor(null)}>
          Cancelar
        </Button>
      </div>
    </BottomSheet>
    </>
  );
}
