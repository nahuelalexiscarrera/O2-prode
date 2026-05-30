"use client";

import { useState } from "react";
import { ScoreInput, type ScoreStatus } from "@/components/ui/ScoreInput";
import { Flag } from "@/components/ui/Flag";
import { teamShortCode } from "@/lib/i18n/team-codes";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/ui/Icon";
import { Countdown } from "@/components/features/Countdown";
import { useToast } from "@/components/ui/Toast";
import { upsertPrediction } from "@/lib/predictions/actions";
import { cn } from "@/lib/utils/cn";

// ─── Types ────────────────────────────────────────────────────────────

interface MatchCardProps {
  matchId: string;
  homeCode: string;
  awayCode: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  matchStatus: "scheduled" | "live" | "finished" | "postponed";
  predictionHome: number | null;
  predictionAway: number | null;
  resultHome?: number | null;
  resultAway?: number | null;
  pointsEarned?: number | null;
  className?: string;
}

// ─── Lockout helper ───────────────────────────────────────────────────

function resolveScoreStatus(
  matchStatus: MatchCardProps["matchStatus"],
  kickoffAt: string
): ScoreStatus {
  if (matchStatus === "finished") return "settled";
  if (matchStatus === "live") return "live";
  if (matchStatus === "postponed") return "locked";
  const lockoutMs = new Date(kickoffAt).getTime() - 60 * 60 * 1000;
  return Date.now() >= lockoutMs ? "locked" : "default";
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

// ─── MatchCard ────────────────────────────────────────────────────────

export function MatchCard({
  matchId,
  homeCode,
  awayCode,
  homeTeamName,
  awayTeamName,
  kickoffAt,
  matchStatus,
  predictionHome,
  predictionAway,
  resultHome,
  resultAway,
  pointsEarned,
  className,
}: MatchCardProps) {
  const [homeValue, setHomeValue] = useState<number | null>(predictionHome);
  const [awayValue, setAwayValue] = useState<number | null>(predictionAway);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const scoreStatus = resolveScoreStatus(matchStatus, kickoffAt);
  const isSettled = scoreStatus === "settled";
  const isCorrect = isSettled && (pointsEarned ?? 0) > 0;

  const displayHome = isSettled ? (resultHome ?? null) : homeValue;
  const displayAway = isSettled ? (resultAway ?? null) : awayValue;

  const lockoutMs = new Date(kickoffAt).getTime() - 60 * 60 * 1000;
  const nearLockout =
    !isSettled && scoreStatus === "default" && lockoutMs - Date.now() < 2 * 3600 * 1000;

  async function handleSave(home: number | null, away: number | null) {
    if (home === null || away === null) return;
    setHomeValue(home);
    setAwayValue(away);
    setSaving(true);
    const result = await upsertPrediction({ matchId, homeScore: home, awayScore: away });
    setSaving(false);
    if ("error" in result) {
      toast({ variant: "error", message: String(result.error) });
    } else {
      toast({ variant: "success", message: "Predicción guardada" });
    }
  }

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-4",
        saving && "opacity-70",
        className
      )}
    >
      {/* Header: live badge or kickoff time */}
      <div className="flex items-center justify-between mb-3">
        {matchStatus === "live" ? (
          <Tag variant="live" />
        ) : isSettled ? (
          <Tag variant="closed" />
        ) : scoreStatus === "locked" ? (
          <div className="flex items-center gap-1 text-text-muted">
            <Icon name="lock" size={12} />
            <span className="text-[11px] font-semibold">Cerrado</span>
          </div>
        ) : (
          <span className="text-[11px] text-text-muted">{formatKickoff(kickoffAt)}</span>
        )}

        {isSettled && pointsEarned !== undefined && pointsEarned !== null && (
          <span
            className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-full",
              isCorrect ? "bg-success/20 text-success" : "bg-error/20 text-error"
            )}
          >
            {pointsEarned > 0 ? `+${pointsEarned} pts` : "0 pts"}
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home team */}
        <div className="flex flex-col items-center gap-1.5 w-[72px]">
          <Flag code={homeCode} size="md" />
          <span className="text-body-xs text-text text-center font-semibold leading-tight line-clamp-2">
            {homeTeamName}
          </span>
        </div>

        {/* Score input */}
        <ScoreInput
          homeValue={displayHome}
          awayValue={displayAway}
          homeLabel={teamShortCode(homeCode)}
          awayLabel={teamShortCode(awayCode)}
          status={scoreStatus}
          onHomeChange={setHomeValue}
          onAwayChange={setAwayValue}
          onSave={handleSave}
          homeCorrect={isSettled ? isCorrect : undefined}
          awayCorrect={isSettled ? isCorrect : undefined}
          lockoutLabel={scoreStatus === "locked" ? `Cerró ${formatKickoff(kickoffAt)}` : undefined}
        />

        {/* Away team */}
        <div className="flex flex-col items-center gap-1.5 w-[72px]">
          <Flag code={awayCode} size="md" />
          <span className="text-body-xs text-text text-center font-semibold leading-tight line-clamp-2">
            {awayTeamName}
          </span>
        </div>
      </div>

      {/* Countdown — shown when match is editable and within 2h of lockout */}
      {(nearLockout || scoreStatus === "default") && matchStatus === "scheduled" && (
        <div className="flex items-center justify-center gap-1 mt-3 text-text-muted">
          <Icon name="clock" size={12} />
          <Countdown
            kickoffAt={new Date(lockoutMs).toISOString()}
            prefix="Cierra en"
            className="text-[11px]"
          />
        </div>
      )}
    </div>
  );
}
