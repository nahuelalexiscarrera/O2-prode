import { cn } from "@/lib/utils/cn";

type SkeletonVariant = "text" | "card" | "row" | "circle";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

const variantBase: Record<SkeletonVariant, string> = {
  text: "h-4 w-full rounded-sm",
  card: "h-32 w-full rounded-lg",
  row: "h-14 w-full rounded-md",
  circle: "h-10 w-10 rounded-full",
};

export function Skeleton({ variant = "text", width, height, lines = 1, className }: SkeletonProps) {
  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn("skeleton h-4 rounded-sm", i === lines - 1 && "w-3/4")} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("skeleton", variantBase[variant], className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}
