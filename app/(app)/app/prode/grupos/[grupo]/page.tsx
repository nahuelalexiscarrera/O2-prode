import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatchesByGroup } from "@/lib/matches/queries";
import { getMyPredictionsForMatches } from "@/lib/predictions/queries";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { ProdeTabs } from "@/components/features/ProdeTabs";
import { GroupChipBar } from "@/components/features/GroupChipBar";
import { MatchCard } from "@/components/features/MatchCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils/cn";

// Esta ruta requiere sesión: force-dynamic evita que Next.js intente pre-renderizarla.
export const dynamic = "force-dynamic";

// ─── Valid groups ─────────────────────────────────────────────────────

const VALID = new Set(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"]);

// ─── Page ─────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ grupo: string }>;
}

export default async function GroupStagePage({ params }: Props) {
  const { grupo } = await params;
  const groupLetter = grupo.toLowerCase();
  if (!VALID.has(groupLetter)) redirect("/app/prode/grupos/a");

  const groupId = groupLetter.toUpperCase();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  const user = data.user;

  const matches = await getMatchesByGroup(groupId);
  const matchIds = matches.map((m) => m.id);
  const predictionsMap = await getMyPredictionsForMatches(user.id, matchIds);

  const filledCount = Object.keys(predictionsMap).length;
  const totalCount = matches.length;

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

      {/* Group chip bar */}
      <GroupChipBar activeGroup={groupId} />

      {/* Match list */}
      <div className="flex flex-col gap-3 px-4">
        {matches.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <p className="text-body-sm text-text-muted">
              No hay partidos cargados para el Grupo {groupId}.
            </p>
          </div>
        ) : (
          matches.map((match) => {
            const pred = predictionsMap[match.id];
            type ResultRow = { home_score: number; away_score: number; finished_at: string };
            type TeamRow = { code: string; name: string };
            const result = match.result as unknown as ResultRow | null;
            const homeTeam = match.home_team as unknown as TeamRow | null;
            const awayTeam = match.away_team as unknown as TeamRow | null;

            return (
              <MatchCard
                key={match.id}
                matchId={match.id}
                homeCode={match.home_code}
                awayCode={match.away_code}
                homeTeamName={homeTeam?.name ?? match.home_code.toUpperCase()}
                awayTeamName={awayTeam?.name ?? match.away_code.toUpperCase()}
                kickoffAt={match.kickoff_at}
                matchStatus={match.status}
                predictionHome={pred?.home_score ?? null}
                predictionAway={pred?.away_score ?? null}
                resultHome={result?.home_score ?? null}
                resultAway={result?.away_score ?? null}
                pointsEarned={pred?.points_earned ?? null}
              />
            );
          })
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="flex flex-col gap-1.5 px-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted">
              {filledCount} de {totalCount} cargados
            </span>
            <span className="text-[11px] font-semibold text-primary">
              {Math.round((filledCount / totalCount) * 100)}%
            </span>
          </div>
          <ProgressBar
            value={(filledCount / totalCount) * 100}
            max={100}
            aria-label={`${filledCount} de ${totalCount} predicciones cargadas`}
          />
        </div>
      )}
    </div>
  );
}
