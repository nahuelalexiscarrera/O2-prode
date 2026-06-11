"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flag } from "@/components/ui/Flag";
import { Tag } from "@/components/ui/Tag";
import { Countdown } from "@/components/features/Countdown";
import { useMatchLive } from "@/lib/matches/realtime";
import { cn } from "@/lib/utils/cn";

interface NextMatchHeroProps {
  matchId: string;
  homeCode: string;
  awayCode: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  groupId: string | null;
  status: string;
  liveHomeScore: number | null;
  liveAwayScore: number | null;
  className?: string;
}

/**
 * Minuto de juego aproximado desde el kickoff. football-data.org no expone el
 * minuto real, así que lo estimamos: el "~" es deliberado (honestidad con el
 * socio). Pasados ~110' (descuentos largos / prórroga) no arriesgamos número.
 */
function approxMinute(kickoffAt: string, now: number): string | null {
  const min = Math.floor((now - new Date(kickoffAt).getTime()) / 60_000);
  if (min < 1) return null;
  if (min <= 45) return `~${min}'`;
  if (min <= 62) return "Entretiempo";
  if (min <= 110) return `~${min - 17}'`;
  return null;
}

export function NextMatchHero({
  matchId,
  homeCode,
  awayCode,
  homeTeamName,
  awayTeamName,
  kickoffAt,
  groupId,
  status,
  liveHomeScore,
  liveAwayScore,
  className,
}: NextMatchHeroProps) {
  const live = useMatchLive(matchId, {
    status,
    liveHome: liveHomeScore,
    liveAway: liveAwayScore,
  });
  const isLive = live.status === "live";
  // Partido que terminó mientras el socio miraba el home (vía realtime): dejamos
  // el score final visible con "Final" en vez de volver a un countdown vencido.
  const isFinished = live.status === "finished";
  const showScore = isLive || isFinished;

  // Minuto aproximado: calculado SOLO post-mount (Date.now() en SSR provocaría
  // hydration mismatch) y refrescado cada 30s mientras está en vivo.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!isLive) {
      setNow(null);
      return;
    }
    setNow(Date.now()); // tick inmediato al pasar a vivo (sin esperar 30s)
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [isLive]);

  const prodeHref = groupId ? `/app/prode/grupos/${groupId.toLowerCase()}` : "/app/prode/grupos/a";
  const minute = isLive && now !== null ? approxMinute(kickoffAt, now) : null;

  return (
    <div
      className={cn("bg-card rounded-xl border border-border p-4 flex flex-col gap-4", className)}
    >
      <div className="flex items-center justify-between">
        {isLive ? (
          <>
            <Tag variant="live" />
            {minute && (
              <span className="text-[11px] font-semibold text-text-muted tabular-nums">
                {minute}
              </span>
            )}
          </>
        ) : isFinished ? (
          <Tag variant="closed" label="Final" />
        ) : (
          <>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Próximo partido
            </span>
            <Countdown
              kickoffAt={kickoffAt}
              prefix="Faltan"
              className="text-[11px] font-semibold text-primary"
            />
          </>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-1.5">
          <Flag code={homeCode} size="lg" />
          <span className="text-body-sm font-semibold text-text text-center">{homeTeamName}</span>
        </div>

        {showScore ? (
          <span className="font-display text-[2.5rem] leading-none text-text tabular-nums select-none">
            {live.liveHome ?? 0}
            <span className="text-text-muted mx-1.5">–</span>
            {live.liveAway ?? 0}
          </span>
        ) : (
          <span className="font-display text-heading-lg text-text-muted select-none">vs</span>
        )}

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
        {showScore ? "Ver el grupo" : "Ir a mi prode"}
      </Link>
    </div>
  );
}
