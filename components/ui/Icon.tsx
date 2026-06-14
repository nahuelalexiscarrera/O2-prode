/**
 * O2 PRODE — Icon component
 * Agente 7 · Wraps the custom SVG sprite from design/icons.svg
 *
 * NO usa Lucide ni emojis. Solo el sistema custom (Agente 4 extension).
 *
 * @example
 *   <Icon name="nav-trophy" size={24} className="text-primary" />
 *   <Icon name="flag-ar" size={32} />  // banderas tienen viewBox 24×16
 */

import { cn } from "@/lib/utils/cn";

export type IconName =
  // Navigation
  | "nav-home"
  | "nav-trophy"
  | "nav-chart"
  | "nav-chat"
  | "nav-user"
  // Actions
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "arrow-down"
  | "close"
  | "share"
  | "download"
  | "more"
  // States
  | "lock"
  | "clock"
  | "bell"
  | "check"
  | "x-mark"
  | "eye"
  | "info"
  | "alert"
  // Social
  | "heart"
  | "heart-filled"
  | "comment"
  | "send"
  // Sports / gamification
  | "medal"
  | "ball"
  | "target"
  | "flame"
  | "star"
  | "crown"
  | "ticket"
  // System
  | "settings"
  | "logout"
  // Brand
  | "o2-mark"
  // Decorative
  | "sol-de-mayo"
  | "world-trophy"
  // Flags (incomplete list — extend as needed)
  | "flag-ar"
  | "flag-br"
  | "flag-jp"
  | "flag-de"
  | "flag-fr"
  | "flag-nl"
  | "flag-sn"
  | "flag-ec"
  | "flag-qa"
  | "flag-gb"
  | "flag-ir"
  | "flag-hr"
  | "flag-ma"
  | "flag-mx";

interface IconProps extends Omit<React.SVGAttributes<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number | string;
  className?: string;
}

export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  const isFlag = name.startsWith("flag-");
  // Flags have viewBox 24x16 → preserve aspect by inferring height
  const width = typeof size === "number" ? size : undefined;
  const height = isFlag && typeof size === "number" ? Math.round((size * 16) / 24) : size;

  return (
    <svg
      width={width}
      height={height}
      className={cn("inline-block flex-shrink-0", className)}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <use href={`/design/icons.svg#${name}`} />
    </svg>
  );
}
