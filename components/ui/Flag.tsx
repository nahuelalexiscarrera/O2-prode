import { cn } from "@/lib/utils/cn";

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

export function Flag({ code, size = "md", alt, className }: FlagProps) {
  const { w, h } = sizeMap[size];

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
      <use href={`/design/icons.svg#flag-${code}`} />
    </svg>
  );
}
