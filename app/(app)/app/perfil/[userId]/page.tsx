import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfileById } from "@/lib/users/queries";
import { getLevelMeta } from "@/lib/achievements/levels";
import { ACHIEVEMENTS } from "@/lib/achievements/catalog";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { StatCard } from "@/components/features/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { UserLevel } from "@/types/domain";

const VALID_ICONS = new Set<string>([
  "target", "flame", "check", "medal", "crown", "ball", "clock", "comment",
  "heart", "share", "nav-user", "nav-chart", "arrow-up", "world-trophy", "star",
]);
function toIconName(ref: string): IconName {
  return VALID_ICONS.has(ref) ? (ref as IconName) : "star";
}

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");

  // El perfil propio se ve en /app/perfil (con settings/compartir).
  if (userId === data.user.id) redirect("/app/perfil");

  const profile = await getUserProfileById(userId);
  if (!profile) notFound();

  const { data: uaRows } = await supabase
    .from("user_achievement")
    .select("achievement_id")
    .eq("user_id", userId);

  const unlockedIds = new Set((uaRows ?? []).map((r) => r.achievement_id as string));
  const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id));

  const level = Number(profile.level) as UserLevel;
  const levelName = getLevelMeta(level).name;
  const positionLabel = profile.position > 0 ? `#${profile.position}` : "—";
  const firstName = profile.name?.split(" ")?.[0] ?? "Socio";

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col">
      <ScreenHeader title={`Perfil de ${firstName}`} backHref="/app/muro" />

      {/* Avatar + nombre + nivel */}
      <div className="flex flex-col items-center gap-3 pt-6 pb-8 px-4">
        <Avatar
          name={profile.name}
          initials={profile.initials}
          avatarUrl={profile.avatar_url}
          size="xl"
          levelBadge={level}
        />
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-display text-heading-sm text-text">{profile.name}</span>
          <span className="text-body-sm text-text-muted">{levelName}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-4 pb-6">
        <StatCard label="Posición" value={positionLabel} accent="primary" />
        <StatCard label="Puntos" value={profile.total_points} accent="lime" />
      </div>

      {/* Logros desbloqueados */}
      <div className="px-4 pb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">
            Logros
          </h2>
          <span className="text-[11px] text-text-muted">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </div>

        {unlocked.length === 0 ? (
          <p className="text-body-sm text-text-muted">Todavía no desbloqueó logros.</p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {unlocked.map((ach) => (
              <div key={ach.id} className="flex flex-col items-center gap-1 text-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full bg-primary/10"
                  )}
                >
                  <Icon name={toIconName(ach.iconRef)} size={22} className="text-primary" />
                </div>
                <span className="text-[10px] text-text-muted leading-tight line-clamp-2">
                  {ach.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
