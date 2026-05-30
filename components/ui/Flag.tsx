import { cn } from "@/lib/utils/cn";
import { teamShortCode } from "@/lib/i18n/team-codes";

export type FlagSize = "sm" | "md" | "lg";

interface FlagProps {
  code: string; // ISO alpha-2 lowercase: "ar", "br", "de", …
  size?: FlagSize;
  alt?: string;
  className?: string;
}

const sizeMap: Record<FlagSize, { w: number; h: number }> = {
  sm: { w: 24, h: 16 },
  md: { w: 32, h: 22 },
  lg: { w: 48, h: 32 },
};

// Banderas presentes en design/icons.svg. Cualquier otra cae a un chip con el
// código FIFA (placeholder prolijo) en vez de un SVG roto/vacío.
const AVAILABLE_FLAGS = new Set([
  "ar", "br", "de", "ec", "fr", "gb", "hr", "ir", "jp", "ma", "mx", "nl", "qa", "sn",
]);

export function Flag({ code, size = "md", alt, className }: FlagProps) {
  const { w, h } = sizeMap[size];
  const lc = code.toLowerCase();

  // Fallback prolijo cuando la bandera no está en el sprite.
  if (!AVAILABLE_FLAGS.has(lc)) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt ?? undefined}
        aria-hidden={alt ? undefined : true}
        style={{ width: w, height: h }}
        className={cn(
          "inline-flex items-center justify-center flex-shrink-0 rounded-[3px]",
          "bg-elevated border border-border text-text-secondary font-bold leading-none",
          size === "lg" ? "text-[11px]" : size === "md" ? "text-[9px]" : "text-[7px]",
          className
        )}
      >
        {teamShortCode(lc)}
      </span>
    );
  }

  return (
    <svg
      width={w}
      height={h}
      className={cn("inline-block flex-shrink-0 rounded-[3px] overflow-hidden", className)}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
      role={alt ? "img" : undefined}
      focusable="false"
    >
      <use href={`/design/icons.svg#flag-${lc}`} />
    </svg>
  );
}
