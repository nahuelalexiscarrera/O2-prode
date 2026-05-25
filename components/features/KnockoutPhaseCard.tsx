import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

interface KnockoutPhaseCardProps {
  label: string;
  multiplier: number;
  isLocked: boolean;
  unlockLabel?: string;
  matchCount?: number;
  className?: string;
}

export function KnockoutPhaseCard({
  label,
  multiplier,
  isLocked,
  unlockLabel,
  matchCount,
  className,
}: KnockoutPhaseCardProps) {
  if (isLocked) {
    return (
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border",
          className
        )}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-body-sm font-semibold text-text-muted">{label}</span>
          {unlockLabel && (
            <span className="text-[11px] text-text-disabled">{unlockLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-text-muted bg-elevated px-2 py-0.5 rounded-full">
            x{multiplier}
          </span>
          <Icon name="lock" size={16} className="text-text-disabled" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3",
        "bg-primary/10 rounded-xl border border-primary/30",
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-body-sm font-semibold text-primary">{label}</span>
        <span className="text-[11px] text-primary/70">
          {matchCount ? `${matchCount} partidos · Activo` : "Activo"}
        </span>
      </div>
      <span className="font-bold text-primary bg-primary/20 px-2.5 py-1 rounded-full text-[13px]">
        x{multiplier}
      </span>
    </div>
  );
}
