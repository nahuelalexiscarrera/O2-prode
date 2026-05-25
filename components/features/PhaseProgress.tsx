import { cn } from "@/lib/utils/cn";
import type { Phase } from "@/types/domain";

const PHASES: { key: Phase; label: string; short: string }[] = [
  { key: "groups", label: "Grupos", short: "G" },
  { key: "round-of-16", label: "Octavos", short: "O" },
  { key: "quarter", label: "Cuartos", short: "C" },
  { key: "semi", label: "Semis", short: "S" },
  { key: "final", label: "Final", short: "F" },
];

const ORDER: Phase[] = ["groups", "round-of-16", "quarter", "semi", "final"];

interface PhaseProgressProps {
  currentPhase: Phase;
  /** Optional: let user navigate to past/current phases */
  onPhaseClick?: (phase: Phase) => void;
}

export function PhaseProgress({ currentPhase, onPhaseClick }: PhaseProgressProps) {
  const currentIdx = ORDER.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-0" aria-label="Progreso del torneo">
      {PHASES.map((p, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;
        const isClickable = (isPast || isCurrent) && !!onPhaseClick;

        const dot = (
          <button
            type="button"
            key={p.key}
            disabled={!isClickable}
            onClick={() => isClickable && onPhaseClick?.(p.key)}
            aria-label={p.label}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 focus-visible:outline-none",
              isClickable && "cursor-pointer",
              !isClickable && "cursor-default"
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full border-2 text-[10px] font-bold transition-colors",
                isCurrent && "border-primary bg-primary text-text-inverse",
                isPast && "border-primary bg-primary/20 text-primary",
                isFuture && "border-border bg-transparent text-text-muted"
              )}
            >
              {p.short}
            </span>
          </button>
        );

        if (i === PHASES.length - 1) return dot;

        return (
          <div key={p.key} className="flex items-center">
            {dot}
            <div
              className={cn(
                "h-0.5 w-6 mx-1 transition-colors",
                i < currentIdx ? "bg-primary" : "bg-border"
              )}
              aria-hidden="true"
            />
          </div>
        );
      })}
    </div>
  );
}
