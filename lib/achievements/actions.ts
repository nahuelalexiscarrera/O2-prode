/**
 * O2 PRODE — Achievement Server Actions
 * Agente 11 · Gamification
 *
 * Persists unlocked achievements, applies bonus points,
 * creates notifications, and returns the list of newly-unlocked items
 * for the client to display via Modal M16.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";
import { evaluateForEvent, type EventScope, type TriggerContext } from "./triggers";
import { ACHIEVEMENT_BY_ID } from "./catalog";

// ─── Helper: get user's already-unlocked achievement IDs ─────────────

async function getUnlockedIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_achievement")
    .select("achievement_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.achievement_id));
}

// ─── Main: evaluate + persist ────────────────────────────────────────

/**
 * Called from match settle handler, social action handlers, or cron jobs.
 * Returns the list of newly-unlocked achievements (for UI to display).
 */
export async function processAchievements(
  scope: EventScope,
  ctx: TriggerContext
): Promise<
  Array<{ id: string; name: string; iconRef: string; pointsBonus: number; impact: string }>
> {
  const supabase = await createClient();
  const alreadyUnlocked = await getUnlockedIds(ctx.userId);
  const newlyUnlocked = evaluateForEvent(scope, ctx, alreadyUnlocked);

  if (newlyUnlocked.length === 0) return [];

  const rowsToInsert = newlyUnlocked.map((r) => ({
    user_id: ctx.userId,
    achievement_id: r.achievement.id,
    unlocked_at: new Date().toISOString(),
    shared: false,
  }));

  const { error: insertErr } = await supabase.from("user_achievement").insert(rowsToInsert);

  if (insertErr) throw insertErr;

  // Sum bonus points
  const totalBonus = newlyUnlocked.reduce((sum, r) => sum + r.achievement.pointsBonus, 0);

  if (totalBonus > 0) {
    // service role: fn_add_points queda REVOCADA para usuarios (un socio no debe
    // poder auto-sumarse puntos llamando la RPC directo). Se ejecuta con
    // privilegios de servicio desde el server. Los crons también usan service role.
    const adminDb = createAdminClient();
    const { error: rpcErr } = await adminDb.rpc("fn_add_points", {
      p_user_id: ctx.userId,
      p_delta: totalBonus,
    });
    if (rpcErr) {
      // Fallback no atómico (también con service role)
      const { data: user } = await adminDb
        .from("user")
        .select("total_points")
        .eq("id", ctx.userId)
        .single();
      if (user) {
        await adminDb
          .from("user")
          .update({ total_points: (user.total_points ?? 0) + totalBonus })
          .eq("id", ctx.userId);
      }
    }
  }

  // Create in-app notifications for each unlock.
  // service role: la tabla notification no tiene policy de INSERT, así que
  // insertarlas con el cliente de usuario fallaría por RLS (en silencio) y la
  // campana nunca mostraría los logros. El cron y los triggers ya usan rutas
  // privilegiadas; acá hacemos lo mismo para la notif propia.
  const notifs = newlyUnlocked.map((r) => ({
    user_id: ctx.userId,
    type: "achievement-unlocked" as const,
    title: "Logro desbloqueado",
    body: `${r.achievement.name} · ${r.achievement.description}`,
    deep_link: `/app/perfil/logros#${r.achievement.id}`,
  }));
  await createAdminClient().from("notification").insert(notifs);

  revalidateTag(`user-${ctx.userId}-achievements`);

  return newlyUnlocked.map((r) => ({
    id: r.achievement.id,
    name: r.achievement.name,
    iconRef: r.achievement.iconRef,
    pointsBonus: r.achievement.pointsBonus,
    impact: r.achievement.impact,
  }));
}

/**
 * Marks an achievement as shared (called from Share completion flow).
 * Can in turn unlock S03 "Embajador" via processAchievements.
 */
export async function markAchievementShared(achievementId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  if (!ACHIEVEMENT_BY_ID.has(achievementId)) {
    throw new Error(`Unknown achievement: ${achievementId}`);
  }

  await supabase
    .from("user_achievement")
    .update({ shared: true })
    .match({ user_id: user.id, achievement_id: achievementId });
}
