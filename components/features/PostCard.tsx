import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { UserLevel } from "@/types/domain";

interface PostCardCompactProps {
  postId: string;
  authorName: string;
  authorInitials: string;
  authorAvatarUrl: string | null;
  authorLevel: UserLevel;
  body: string;
  /** Relative time string, e.g. "hace 10 min" */
  timeAgo: string;
  className?: string;
}

export function PostCardCompact({
  postId,
  authorName,
  authorInitials,
  authorAvatarUrl,
  authorLevel,
  body,
  timeAgo,
  className,
}: PostCardCompactProps) {
  return (
    <Link
      href={`/app/muro/${postId}`}
      className={cn(
        "flex items-center gap-3 p-3 bg-card rounded-xl border border-border",
        "hover:border-border-strong transition-colors",
        className
      )}
      aria-label={`${authorName}: ${body}`}
    >
      <Avatar
        name={authorName}
        initials={authorInitials}
        avatarUrl={authorAvatarUrl}
        levelBadge={authorLevel}
        size="sm"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-body-sm font-semibold text-text truncate">{authorName}</span>
          <span className="text-[10px] text-text-muted shrink-0">{timeAgo}</span>
        </div>
        <p className="text-body-sm text-text-muted truncate">{body}</p>
      </div>

      <Icon name="arrow-right" size={16} className="text-text-muted shrink-0" />
    </Link>
  );
}
