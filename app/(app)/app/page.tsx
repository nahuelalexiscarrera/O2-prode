import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/users/queries";
import { getNextMatch, type NextMatchRow } from "@/lib/matches/queries";
import { getFeedRecientes } from "@/lib/social/queries";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { StatCard } from "@/components/features/StatCard";
import { NextMatchHero } from "@/components/features/NextMatchHero";
import { PhaseProgress } from "@/components/features/PhaseProgress";
import { PostCardCompact } from "@/components/features/PostCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { UserLevel } from "@/types/domain";

// ─── Helpers ──────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

type TeamRow = { code: string; name: string };

function NextMatchSection({ match }: { match: NextMatchRow }) {
  if (!match) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center">
        <p className="text-body-sm text-text-muted">No hay partidos programados por el momento.</p>
      </div>
    );
  }
  const homeTeam = match.home_team as unknown as TeamRow | null;
  const awayTeam = match.away_team as unknown as TeamRow | null;
  if (!homeTeam || !awayTeam) return null;

  return (
    <NextMatchHero
      homeCode={match.home_code}
      awayCode={match.away_code}
      homeTeamName={homeTeam.name}
      awayTeamName={awayTeam.name}
      kickoffAt={match.kickoff_at}
      groupId={match.group_id}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient();
  // Defensive: an errored or orphaned session (deleted auth user) can come back
  // as an error and/or a null `data`. Never destructure blindly — treat anything
  // that isn't a real user as logged-out and bounce to /login.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");

  const [profile, nextMatch, feed] = await Promise.all([
    getMyProfile(),
    getNextMatch(),
    getFeedRecientes({ limit: 3 }),
  ]);

  const firstName = profile?.name?.split(" ")?.[0] ?? "Socio";

  return (
    <div
      className={cn(
        "min-h-screen px-4 pb-[calc(5rem+env(safe-area-inset-bottom))]",
        "flex flex-col gap-5"
      )}
    >
      {/* Header */}
      <ScreenHeader
        title={`Hola, ${firstName}`}
        actions={
          <Link
            href="/app/perfil/notificaciones"
            aria-label="Notificaciones"
            className="flex items-center justify-center w-9 h-9 rounded-full text-text-muted hover:text-text transition-colors"
          >
            <Icon name="bell" size={22} />
          </Link>
        }
      />

      {/* Stat cards */}
      {profile ? (
        <div className="flex gap-3">
          <StatCard
            label="Tu pos."
            value={profile.position > 0 ? `#${profile.position}` : "—"}
            accent="primary"
          />
          <StatCard label="Tus pts" value={profile.total_points} accent="lime" />
        </div>
      ) : (
        <div className="flex gap-3">
          <Skeleton className="h-24 flex-1 rounded-xl" />
          <Skeleton className="h-24 flex-1 rounded-xl" />
        </div>
      )}

      {/* Next match hero */}
      <NextMatchSection match={nextMatch} />

      {/* Phase progress */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Progreso del torneo
        </span>
        <PhaseProgress currentPhase="groups" />
      </div>

      {/* Recent activity */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Actividad reciente
          </span>
          <Link href="/app/muro" className="text-[11px] font-semibold text-primary">
            Ver todo
          </Link>
        </div>

        {feed.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-body-sm text-text-muted">
              Todavía no hay actividad. Sé el primero en postear.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {feed.map((post) => {
              type AuthorRow = {
                id: string;
                name: string;
                initials: string;
                avatar_url: string | null;
                level: UserLevel;
              };
              const author = post.author as unknown as AuthorRow | null;
              if (!author) return null;
              return (
                <PostCardCompact
                  key={post.id}
                  postId={post.id}
                  authorName={author.name}
                  authorInitials={author.initials}
                  authorAvatarUrl={author.avatar_url}
                  authorLevel={author.level}
                  body={post.body}
                  timeAgo={timeAgo(post.created_at)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
