import { cn } from "@/lib/utils/cn";

// ─── Linear ──────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, max = 100, label, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="text-body-xs text-text-muted">{label}</span>
          <span className="text-body-xs text-text-muted tabular">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full bg-border rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-primary rounded-full transition-[width] duration-slow ease-standard"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Circular ────────────────────────────────────────────────────────

interface CircularProgressProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  showValue,
  className,
}: CircularProgressProps) {
  const pct = Math.min(100, Math.max(0, value));
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--brand-primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      {showValue && (
        <span className="absolute text-[10px] font-bold tabular text-text">{Math.round(pct)}%</span>
      )}
    </div>
  );
}
