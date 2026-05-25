import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils/cn";
import type { UserLevel } from "@/types/domain";

interface RankingRowProps {
  position: number;
  userId: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  level: UserLevel;
  points: number;
  delta?: number;
  isMe?: boolean;
  className?: string;
}

export function RankingRow({
  position,
  userId,
  name,
  initials,
  avatarUrl,
  level,
  points,
  delta = 0,
  isMe,
  className,
}: RankingRowProps) {
  const deltaLabel = delta === 0 ? null : delta > 0 ? `+${delta}` : String(delta);
  const href = isMe ? "/app/perfil" : `/app/perfil/${userId}`;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 transition-colors",
        isMe
          ? "bg-primary/5 border-y border-primary/15"
          : "hover:bg-elevated/40 border-b border-border last:border-b-0",
        className
      )}
    >
      {/* Position */}
      <span
        className={cn(
          "w-7 shrink-0 text-center font-display text-body-sm tabular-nums",
          isMe ? "text-primary font-bold" : "text-text-muted"
        )}
      >
        {position}
      </span>

      {/* Avatar */}
      <Avatar
        name={name}
        initials={initials}
        avatarUrl={avatarUrl}
        size="sm"
        levelBadge={level}
      />

      {/* Name */}
      <span
        className={cn(
          "flex-1 text-body-sm font-semibold truncate",
          isMe ? "text-primary" : "text-text"
        )}
      >
        {name}
        {isMe && (
          <span className="ml-1.5 text-[10px] font-bold text-primary/60 uppercase tracking-wide">
            Vos
          </span>
        )}
      </span>

      {/* Points + delta */}
      <div className="flex flex-col items-end shrink-0">
        <span className="font-display text-body-sm tabular-nums text-text font-bold">
          {points}
        </span>
        {deltaLabel && (
          <span
            className={cn(
              "text-[10px] font-bold",
              delta > 0 ? "text-success" : "text-error"
            )}
          >
            {deltaLabel}
          </span>
        )}
      </div>
    </Link>
  );
}
