import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACHIEVEMENTS } from "@/lib/achievements/catalog";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { AchievementCategory } from "@/types/domain";
import type { IconName } from "@/components/ui/Icon";

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  skill: "Habilidad",
  consistency: "Constancia",
  social: "Social",
  position: "Posición",
};

const CATEGORIES: AchievementCategory[] = ["skill", "consistency", "social", "position"];

const VALID_ICONS = new Set<string>([
  "target", "flame", "check", "medal", "crown", "ball", "clock", "comment",
  "heart", "share", "nav-user", "nav-chart", "arrow-up", "world-trophy", "star",
]);

function toIconName(ref: string): IconName {
  return VALID_ICONS.has(ref) ? (ref as IconName) : "star";
}

export default async function LogrosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userAchievements } = await supabase
    .from("user_achievement")
    .select("achievement_id, unlocked_at")
    .eq("user_id", user.id);

  const unlockedMap = new Map(
    (userAchievements ?? []).map((ua) => [ua.achievement_id, ua.unlocked_at as string])
  );

  const total = ACHIEVEMENTS.length;
  const unlocked = unlockedMap.size;
  const progressPct = total > 0 ? (unlocked / total) * 100 : 0;

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col">
      <ScreenHeader title="Logros" backHref="/app/perfil" />

      {/* Progress summary */}
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-body-sm text-text-muted">
            {unlocked} de {total} desbloqueados
          </span>
          <span className="text-body-sm font-bold text-primary">
            {Math.round(progressPct)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Achievement categories */}
      <div className="flex flex-col gap-6 px-4 pb-8">
        {CATEGORIES.map((cat) => {
          const catAchievements = ACHIEVEMENTS.filter((a) => a.category === cat);
          const catUnlocked = catAchievements.filter((a) => unlockedMap.has(a.id)).length;

          return (
            <section key={cat}>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <span className="text-[11px] text-text-muted">
                  {catUnlocked}/{catAchievements.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {catAchievements.map((ach) => {
                  const unlockedAt = unlockedMap.get(ach.id);
                  const isUnlocked = !!unlockedAt;
                  const dateLabel = unlockedAt
                    ? new Date(unlockedAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                      })
                    : null;

                  return (
                    <div
                      key={ach.id}
                      id={ach.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border",
                        isUnlocked
                          ? "bg-card border-border"
                          : "bg-elevated border-transparent opacity-50"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full",
                          isUnlocked ? "bg-primary/10" : "bg-border/50"
                        )}
                      >
                        <Icon
                          name={toIconName(ach.iconRef)}
                          size={20}
                          className={isUnlocked ? "text-primary" : "text-text-muted"}
                        />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-semibold text-text truncate">
                          {ach.name}
                        </p>
                        <p className="text-[12px] text-text-muted leading-snug">
                          {ach.description}
                        </p>
                        {dateLabel && (
                          <p className="text-[10px] text-text-muted mt-0.5">
                            {dateLabel}
                          </p>
                        )}
                      </div>

                      {/* Bonus */}
                      <div className="flex-shrink-0 text-right">
                        <span
                          className={cn(
                            "text-[11px] font-bold",
                            isUnlocked ? "text-primary" : "text-text-muted"
                          )}
                        >
                          +{ach.pointsBonus} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
