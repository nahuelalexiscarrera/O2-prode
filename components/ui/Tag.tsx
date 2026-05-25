import { cn } from "@/lib/utils/cn";
import { Icon } from "./Icon";

export type TagVariant = "kickoff" | "live" | "closed" | "locked";

interface TagProps {
  variant: TagVariant;
  label?: string;
  className?: string;
}

export function Tag({ variant, label, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full",
        "text-[10px] font-bold uppercase tracking-[0.06em]",
        variant === "kickoff" && "text-text-muted border border-border",
        variant === "live" &&
          "text-[#FF2D55] border border-[rgba(255,45,85,0.3)] bg-[rgba(255,45,85,0.08)]",
        variant === "closed" && "text-success border border-success/30 bg-success-bg",
        variant === "locked" && "text-text-disabled border border-border",
        className
      )}
    >
      {variant === "kickoff" && <Icon name="clock" size={10} />}

      {variant === "live" && (
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2D55] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF2D55]" />
        </span>
      )}

      {variant === "closed" && <Icon name="check" size={10} />}
      {variant === "locked" && <Icon name="lock" size={10} />}

      {label ?? defaultLabel[variant]}
    </span>
  );
}

const defaultLabel: Record<TagVariant, string> = {
  kickoff: "Próximo",
  live: "En vivo",
  closed: "Cerrado",
  locked: "Bloqueado",
};
