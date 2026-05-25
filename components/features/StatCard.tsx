import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  /** Position change vs last week: positive = moved up */
  delta?: number;
  accent?: "primary" | "lime";
  className?: string;
}

export function StatCard({ label, value, delta, accent = "primary", className }: StatCardProps) {
  const deltaText =
    delta === undefined || delta === 0 ? null : delta > 0 ? `+${delta}` : String(delta);

  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-1 p-4 bg-card rounded-xl border border-border",
        className
      )}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {label}
      </span>

      <span
        className={cn(
          "font-display text-[40px] leading-none tabular-nums",
          accent === "primary" ? "text-primary" : "text-[#C6F135]"
        )}
      >
        {value}
      </span>

      {deltaText && (
        <span
          className={cn("text-[11px] font-bold", (delta ?? 0) > 0 ? "text-success" : "text-error")}
        >
          {deltaText}
        </span>
      )}
    </div>
  );
}
