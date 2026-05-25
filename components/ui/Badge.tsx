import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";
import type { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "ghost";

interface BadgeProps {
  variant?: BadgeVariant;
  leftIcon?: IconName;
  children: ReactNode;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  default: "border border-border text-text-muted",
  primary: "bg-primary-bg text-primary border border-primary/20",
  accent: "bg-[rgba(217,255,63,0.18)] text-accent border border-accent/20",
  success: "bg-success-bg text-success border border-success/20",
  warning: "bg-warning-bg text-warning border border-warning/20",
  error: "bg-error-bg text-error border border-error/20",
  ghost: "bg-transparent text-text-muted",
};

export function Badge({ variant = "default", leftIcon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-[22px] px-2 rounded-sm",
        "text-[11px] font-bold uppercase tracking-[0.04em]",
        variantMap[variant],
        className
      )}
    >
      {leftIcon && <Icon name={leftIcon} size={12} />}
      {children}
    </span>
  );
}
