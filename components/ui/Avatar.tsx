import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type AvatarLevel = 1 | 2 | 3 | 4 | 5;

interface AvatarProps {
  name: string;
  initials: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  levelBadge?: AvatarLevel;
  crownBadge?: boolean;
  className?: string;
}

const sizeMap: Record<AvatarSize, { px: number; text: string; badge: number }> = {
  xs: { px: 24, text: "text-[9px]", badge: 12 },
  sm: { px: 32, text: "text-[11px]", badge: 14 },
  md: { px: 40, text: "text-body-sm", badge: 16 },
  lg: { px: 56, text: "text-body-md", badge: 18 },
  xl: { px: 96, text: "text-heading-sm", badge: 22 },
  "2xl": { px: 128, text: "text-heading-md", badge: 28 },
};

const levelColors: Record<AvatarLevel, string> = {
  1: "bg-elevated text-text-muted border border-border",
  2: "bg-info/20 text-info border border-info/30",
  3: "bg-primary/20 text-primary border border-primary/30",
  4: "bg-warning/20 text-warning border border-warning/30",
  5: "bg-accent/20 text-accent border border-accent/40",
};

const PALETTE = [
  "#FF6A00",
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#D9FF3F",
  "#FF2D55",
  "#A855F7",
  "#06B6D4",
];

function nameColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return PALETTE[h % PALETTE.length] ?? PALETTE[0]!;
}

export function Avatar({
  name,
  initials,
  avatarUrl,
  size = "md",
  levelBadge,
  crownBadge,
  className,
}: AvatarProps) {
  const { px, text, badge } = sizeMap[size];

  return (
    <div
      className={cn("relative inline-flex flex-shrink-0", className)}
      style={{ width: px, height: px }}
    >
      {/* Image or initials fallback */}
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          width={px}
          height={px}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-bold text-text-inverse select-none",
            text
          )}
          style={{ width: px, height: px, backgroundColor: nameColor(name) }}
          aria-label={name}
          role="img"
        >
          {initials.slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Crown (rank #1) — takes priority over level */}
      {crownBadge && (
        <div
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-[#FFD700] shadow-sm"
          style={{ width: badge, height: badge }}
          aria-label="Puesto 1"
        >
          <svg
            width={Math.round(badge * 0.55)}
            height={Math.round(badge * 0.55)}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <use href="/design/icons.svg#crown" />
          </svg>
        </div>
      )}

      {/* Level badge */}
      {levelBadge && !crownBadge && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full",
            "text-[8px] font-bold leading-none",
            levelColors[levelBadge]
          )}
          style={{ width: badge, height: badge }}
          aria-label={`Nivel ${levelBadge}`}
        >
          {levelBadge}
        </div>
      )}
    </div>
  );
}
