import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getKnockoutMatches } from "@/lib/matches/queries";
import { getMyPredictionsForMatches } from "@/lib/predictions/queries";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { ProdeTabs } from "@/components/features/ProdeTabs";
import { KnockoutPhaseCard } from "@/components/features/KnockoutPhaseCard";
import { MatchCard } from "@/components/features/MatchCard";
import { cn } from "@/lib/utils/cn";

// ─── Phase config ─────────────────────────────────────────────────────

const PHASES = [
  {
    phase: "round-of-32" as const,
    label: "16avos de Final",
    multiplier: 2,
    unlockLabel: "Disponible desde el 28 de junio",
  },
  {
    phase: "round-of-16" as const,
    label: "Octavos de Final",
    multiplier: 2,
    unlockLabel: "Disponible desde el 4 de julio",
  },
  {
    phase: "quarter" as const,
    label: "Cuartos de Final",
    multiplier: 3,
    unlockLabel: "Disponible desde el 10 de julio",
  },
  {
    phase: "semi" as const,
    label: "Semifinales",
    multiplier: 4,
    unlockLabel: "Disponible desde el 14 de julio",
  },
  {
    phase: "final" as const,
    label: "Final",
    multiplier: 5,
    unlockLabel: "Disponible desde el 19 de julio",
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────

export default async function KnockoutPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  const user = data.user;

  const allMatches = await getKnockoutMatches();
  const matchIds = allMatches.map((m) => m.id);
  const predictionsMap =
    matchIds.length > 0
      ? await getMyPredictionsForMatches(user.id, matchIds)
      : {};

  return (
    <div
      className={cn(
        "min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]",
        "flex flex-col gap-4"
      )}
    >
      {/* Header */}
      <ScreenHeader title="Mi prode" />

      {/* Phase tabs */}
      <ProdeTabs />

      {/* Phase sections */}
      <div className="flex flex-col gap-4 px-4">
        {PHASES.map(({ phase, label, multiplier, unlockLabel }) => {
          const phaseMatches = allMatches.filter((m) => m.phase === phase);
          // Fase visible si ya existen sus cruces (los crea el cron sync-results cuando
          // football-data.org publica equipos definidos). Los otros gates (server action,
          // RLS, MatchCard) cierran cada partido individual 20 min antes del kickoff.
          const isLocked = phaseMatches.length === 0;

          return (
            <div key={phase} className="flex flex-col gap-3">
              <KnockoutPhaseCard
                label={label}
                multiplier={multiplier}
                isLocked={isLocked}
                unlockLabel={isLocked ? unlockLabel : undefined}
                matchCount={phaseMatches.length}
              />

              {!isLocked && phaseMatches.length > 0 && (
                <div className="flex flex-col gap-3">
                  {phaseMatches.map((match) => {
                    const pred = predictionsMap[match.id];
                    type TeamRow = { code: string; name: string };
                    type ResultRow = { home_score: number; away_score: number };
                    const homeTeam = match.home_team as unknown as TeamRow | null;
                    const awayTeam = match.away_team as unknown as TeamRow | null;
                    const result = match.result as unknown as ResultRow | null;
                    const isArgentina =
                      match.home_code === "ar" || match.away_code === "ar";

                    return (
                      <MatchCard
                        key={match.id}
                        matchId={match.id}
                        homeCode={match.home_code}
                        awayCode={match.away_code}
                        homeTeamName={
                          homeTeam?.name
                            ?? match.home_code.toUpperCase().slice(0, 3)
                        }
                        awayTeamName={
                          awayTeam?.name
                            ?? match.away_code.toUpperCase().slice(0, 3)
                        }
                        kickoffAt={match.kickoff_at}
                        matchStatus={match.status}
                        predictionHome={pred?.home_score ?? null}
                        predictionAway={pred?.away_score ?? null}
                        resultHome={result?.home_score ?? null}
                        resultAway={result?.away_score ?? null}
                        pointsEarned={pred?.points_earned ?? null}
                        featured={isArgentina && match.status !== "finished"}
                        multiplier={multiplier}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
