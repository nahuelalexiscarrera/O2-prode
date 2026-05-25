import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/users/queries";
import { getMyPredictionCount } from "@/lib/predictions/queries";
import { getLevelMeta } from "@/lib/achievements/levels";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { StatCard } from "@/components/features/StatCard";
import { NavRow } from "@/components/features/NavRow";
import { ShareButton } from "@/components/features/ShareButton";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils/cn";
import type { UserLevel } from "@/types/domain";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, predictionCount] = await Promise.all([
    getMyProfile(),
    getMyPredictionCount(user.id),
  ]);

  if (!profile) redirect("/login");

  const level = Number(profile.level) as UserLevel;
  const levelName = getLevelMeta(level).name;
  const positionLabel = profile.position > 0 ? `#${profile.position}` : "—";

  return (
    <div
      className={cn(
        "min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]",
        "flex flex-col"
      )}
    >
      <ScreenHeader
        title="Perfil"
        actions={<ShareButton template="position" userId={user.id} label="Compartir" />}
      />

      {/* Avatar + name + level */}
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
        <StatCard label="Predicciones" value={predictionCount} />
      </div>

      {/* Navigation */}
      <div className="mx-4 bg-card rounded-xl border border-border overflow-hidden">
        <NavRow href="/app/perfil/logros" label="Logros" />
        <NavRow href="/app/perfil/notificaciones" label="Notificaciones" />
        <NavRow href="/app/perfil/configuracion" label="Configuración" />
      </div>
    </div>
  );
}
