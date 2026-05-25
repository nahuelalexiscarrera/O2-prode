"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useAnimation } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { toggleReaction } from "@/lib/social/actions";
import { heartPop } from "@/lib/motion/variants";
import { cn } from "@/lib/utils/cn";
import type { UserLevel } from "@/types/domain";

interface PostCardFullProps {
  postId: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  authorAvatarUrl: string | null;
  authorLevel: UserLevel;
  body: string;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  reactionCount: number;
  commentCount: number;
  myReacted: boolean;
  myUserId: string;
  timeAgo: string;
  isDetailView?: boolean;
}

export function PostCardFull({
  postId,
  authorId,
  authorName,
  authorInitials,
  authorAvatarUrl,
  authorLevel,
  body,
  imageUrl,
  imageWidth,
  imageHeight,
  reactionCount: initialReactionCount,
  commentCount,
  myReacted: initialReacted,
  myUserId,
  timeAgo,
  isDetailView,
}: PostCardFullProps) {
  const [reacted, setReacted] = useState(initialReacted);
  const [count, setCount] = useState(initialReactionCount);
  const pendingRef = useRef(false);
  const heartControls = useAnimation();
  const { toast } = useToast();

  const isOwn = authorId === myUserId;
  const profileHref = isOwn ? "/app/perfil" : `/app/perfil/${authorId}`;

  async function handleToggleReaction() {
    if (pendingRef.current) return;
    pendingRef.current = true;
    const prevReacted = reacted;
    const prevCount = count;
    const nextReacted = !reacted;
    setReacted(nextReacted);
    setCount((c) => c + (nextReacted ? 1 : -1));
    if (nextReacted) void heartControls.start("active");
    try {
      await toggleReaction({ targetType: "post", targetId: postId });
    } catch {
      setReacted(prevReacted);
      setCount(prevCount);
      toast({ variant: "error", message: "No se pudo guardar tu reacción" });
    } finally {
      pendingRef.current = false;
    }
  }

  const paddingBottom =
    imageUrl && imageWidth && imageHeight
      ? `${(imageHeight / imageWidth) * 100}%`
      : null;

  return (
    <article className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={profileHref}>
          <Avatar
            name={authorName}
            initials={authorInitials}
            avatarUrl={authorAvatarUrl}
            size="sm"
            levelBadge={authorLevel}
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            href={profileHref}
            className="text-body-sm font-semibold text-text hover:text-primary transition-colors"
          >
            {authorName}
          </Link>
          <p className="text-[10px] text-text-secondary">{timeAgo}</p>
        </div>
      </div>

      {/* Body */}
      <p className="px-4 pb-3 text-body-sm text-text leading-relaxed whitespace-pre-wrap">
        {body}
      </p>

      {/* Image */}
      {imageUrl && paddingBottom !== null ? (
        <div className="relative w-full overflow-hidden" style={{ paddingBottom }}>
          <Image
            src={imageUrl}
            alt="Imagen del post"
            fill
            className="object-cover"
            sizes="480px"
            loading="lazy"
          />
        </div>
      ) : imageUrl ? (
        // fallback if dimensions not stored
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Imagen del post"
          className="w-full max-h-96 object-cover"
          loading="lazy"
        />
      ) : null}

      {/* Action row */}
      <div className="flex items-center gap-5 px-4 border-t border-border">
        {/* Heart — min-h-[44px] for WCAG 44×44 tap target */}
        <motion.button
          type="button"
          variants={heartPop}
          initial="idle"
          animate={heartControls}
          onClick={handleToggleReaction}
          className={cn(
            "min-h-[44px] flex items-center gap-1.5 text-body-sm font-semibold transition-colors",
            reacted ? "text-error" : "text-text-muted hover:text-error"
          )}
          aria-label={reacted ? "Quitar reacción" : "Reaccionar"}
          aria-pressed={reacted}
        >
          <Icon name={reacted ? "heart-filled" : "heart"} size={18} />
          <span>{count}</span>
        </motion.button>

        {/* Comments */}
        {isDetailView ? (
          <span className="min-h-[44px] flex items-center gap-1.5 text-body-sm text-text-muted">
            <Icon name="comment" size={18} />
            <span>{commentCount}</span>
          </span>
        ) : (
          <Link
            href={`/app/muro/${postId}`}
            className="min-h-[44px] flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text transition-colors"
            aria-label={`Ver ${commentCount} comentarios`}
          >
            <Icon name="comment" size={18} />
            <span>{commentCount}</span>
          </Link>
        )}
      </div>
    </article>
  );
}
