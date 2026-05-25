import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

interface DividerProps {
  orientation?: "horizontal" | "vertical";
  strength?: "soft" | "strong";
  label?: ReactNode;
  className?: string;
}

export function Divider({
  orientation = "horizontal",
  strength = "soft",
  label,
  className,
}: DividerProps) {
  const lineClass = strength === "soft" ? "bg-border/60" : "bg-border-strong";

  if (orientation === "vertical") {
    return <div className={cn("w-px self-stretch", lineClass, className)} />;
  }

  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className={cn("flex-1 h-px", lineClass)} />
        <span className="text-body-xs text-text-muted shrink-0">{label}</span>
        <div className={cn("flex-1 h-px", lineClass)} />
      </div>
    );
  }

  return <div className={cn("h-px w-full", lineClass, className)} />;
}
