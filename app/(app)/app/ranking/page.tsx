import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGlobalRanking, getMyRankEntry } from "@/lib/ranking/queries";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { PodiumCard, type PodiumEntry } from "@/components/features/PodiumCard";
import { RankingRow } from "@/components/features/RankingRow";
import { Divider } from "@/components/ui/Divider";
import { cn } from "@/lib/utils/cn";
import type { UserLevel } from "@/types/domain";

export default async function RankingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  const user = data.user;

  const ranking = await getGlobalRanking(100);

  const podiumEntries: PodiumEntry[] = ranking
    .filter((u) => u.computedPosition <= 3)
    .map((u) => ({
      position: u.computedPosition as 1 | 2 | 3,
      userId: u.id,
      name: u.name,
      initials: u.initials,
      avatarUrl: u.avatar_url,
      level: Number(u.level) as UserLevel,
      points: u.total_points,
    }));

  const listEntries = ranking.filter((u) => u.computedPosition > 3);
  // Si el socio está en el top-100, ya lo tenemos. Si no (rankeado 101-800),
  // computamos su posición aparte para que igual vea dónde está.
  const myEntry =
    ranking.find((u) => u.id === user.id) ?? (await getMyRankEntry(user.id));

  return (
    <div
      className={cn(
        "min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]",
        "flex flex-col"
      )}
    >
      {/* Header */}
      <ScreenHeader title="Ranking" />

      {ranking.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-body-sm text-text-muted">
            El ranking todavía no tiene datos. Empezá a predecir para aparecer acá.
          </p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {podiumEntries.length > 0 && (
            <PodiumCard entries={podiumEntries} myUserId={user.id} />
          )}

          <Divider className="mx-4" />

          {/* Ranking list (#4 onward) — scroll con mask de bordes */}
          <div
            className="overflow-y-auto max-h-[300px] flex flex-col"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}
          >
            {listEntries.map((u) => (
              <RankingRow
                key={u.id}
                position={u.computedPosition}
                userId={u.id}
                name={u.name}
                initials={u.initials}
                avatarUrl={u.avatar_url}
                level={Number(u.level) as UserLevel}
                points={u.total_points}
                delta={u.position_last_week != null ? u.position_last_week - u.computedPosition : 0}
                isMe={u.id === user.id}
              />
            ))}
          </div>
        </>
      )}

      {/* Sticky my-position bar — shown when user is not in top 3 */}
      {myEntry && myEntry.computedPosition > 3 && (
        <div
          className={cn(
            "fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0",
            "max-w-[480px] mx-auto px-4"
          )}
        >
          <div className="bg-elevated border border-primary/20 rounded-xl shadow-lg overflow-hidden">
            <RankingRow
              position={myEntry.computedPosition}
              userId={myEntry.id}
              name={myEntry.name}
              initials={myEntry.initials}
              avatarUrl={myEntry.avatar_url}
              level={Number(myEntry.level) as UserLevel}
              points={myEntry.total_points}
              delta={
                myEntry.position_last_week != null
                  ? myEntry.position_last_week - myEntry.computedPosition
                  : 0
              }
              isMe
            />
          </div>
        </div>
      )}
    </div>
  );
}
