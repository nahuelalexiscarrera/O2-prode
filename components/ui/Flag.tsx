import { cn } from "@/lib/utils/cn";
import { teamShortCode } from "@/lib/i18n/team-codes";

export type FlagSize = "sm" | "md" | "lg";

interface FlagProps {
  /** Código ISO del equipo: "ar", "mx", "gb-sct"… (= nombre del archivo en /flags) */
  code: string;
  size?: FlagSize;
  alt?: string;
  className?: string;
}

const sizeMap: Record<FlagSize, { w: number; h: number }> = {
  sm: { w: 24, h: 16 },
  md: { w: 32, h: 22 },
  lg: { w: 48, h: 32 },
};

// Las 48 banderas del Mundial 2026 viven en /public/flags/{code}.svg (SVG, no emoji).
// Cualquier código fuera de este set (p. ej. un cruce de eliminatorias aún sin
// definir) cae a un chip con la abreviatura FIFA, sin SVG roto.
const AVAILABLE_FLAGS = new Set([
  "mx", "za", "kr", "cz", "ca", "ba", "qa", "ch", "br", "ma", "ht", "gb-sct",
  "us", "py", "au", "tr", "de", "cw", "ci", "ec", "nl", "jp", "se", "tn",
  "be", "eg", "ir", "nz", "es", "cv", "sa", "uy", "fr", "sn", "iq", "no",
  "ar", "dz", "at", "jo", "pt", "cd", "uz", "co", "gb-eng", "hr", "gh", "pa",
]);

export function Flag({ code, size = "md", alt, className }: FlagProps) {
  const { w, h } = sizeMap[size];
  const lc = code.toLowerCase();

  // Fallback prolijo cuando no hay bandera disponible.
  if (!AVAILABLE_FLAGS.has(lc)) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt ?? undefined}
        aria-hidden={alt ? undefined : true}
        style={{ width: w, height: h }}
        className={cn(
          "inline-flex flex-shrink-0 items-center justify-center rounded-[3px]",
          "border border-border bg-elevated font-bold leading-none text-text-secondary",
          size === "lg" ? "text-[11px]" : size === "md" ? "text-[9px]" : "text-[7px]",
          className
        )}
      >
        {teamShortCode(lc)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${lc}.svg`}
      width={w}
      height={h}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : true}
      loading="lazy"
      style={{ width: w, height: h }}
      className={cn(
        "inline-block flex-shrink-0 rounded-[3px] object-cover ring-1 ring-black/20",
        className
      )}
    />
  );
}
