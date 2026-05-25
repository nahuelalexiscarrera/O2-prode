import Link from "next/link";
import { Flag } from "@/components/ui/Flag";
import { Countdown } from "@/components/features/Countdown";
import { cn } from "@/lib/utils/cn";

interface NextMatchHeroProps {
  homeCode: string;
  awayCode: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  groupId: string | null;
  className?: string;
}

export function NextMatchHero({
  homeCode,
  awayCode,
  homeTeamName,
  awayTeamName,
  kickoffAt,
  groupId,
  className,
}: NextMatchHeroProps) {
  const prodeHref = groupId ? `/app/prode/grupos/${groupId.toLowerCase()}` : "/app/prode/grupos/a";

  return (
    <div
      className={cn("bg-card rounded-xl border border-border p-4 flex flex-col gap-4", className)}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Próximo partido
        </span>
        <Countdown
          kickoffAt={kickoffAt}
          prefix="Faltan"
          className="text-[11px] font-semibold text-primary"
        />
      </div>

      {/* Teams */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-1.5">
          <Flag code={homeCode} size="lg" />
          <span className="text-body-sm font-semibold text-text text-center">{homeTeamName}</span>
        </div>

        <span className="font-display text-heading-lg text-text-muted select-none">vs</span>

        <div className="flex flex-col items-center gap-1.5">
          <Flag code={awayCode} size="lg" />
          <span className="text-body-sm font-semibold text-text text-center">{awayTeamName}</span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={prodeHref}
        className={cn(
          "flex items-center justify-center h-12 rounded-xl",
          "bg-primary text-text-inverse font-display text-body-sm font-bold uppercase tracking-wide",
          "transition-opacity active:opacity-80"
        )}
      >
        Ir a mi prode
      </Link>
    </div>
  );
}
