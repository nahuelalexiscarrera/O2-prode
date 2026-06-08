/**
 * O2 PRODE — Core achievement processor (internal, NOT a Server Action).
 *
 * SECURITY (API-003): Este archivo NO tiene directiva "use server".
 * processAchievements NO debe ser callable como Server Action RPC desde el
 * cliente — si se exportara desde un archivo "use server", Next.js lo expondría
 * como endpoint cifrado en /_next/action y cualquier cliente podría invocarlo
 * con scope/TriggerContext arbitrario para auto-otorgarse logros.
 *
 * Solo código server-side importa esta función directamente:
 *   · lib/achievements/match-settled.ts (cron de partidos finalizados)
 *   · lib/achievements/position-reconcile.ts (cron de posiciones)
 *   · lib/social/actions.ts (evalSocialAchievements — interna, no exportada)
 *
 * Las acciones exportadas (Server Actions legítimas) viven en actions.ts.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";
import { evaluateForEvent, type EventScope, type TriggerContext } from "./triggers";
import { ACHIEVEMENT_BY_ID } from "./catalog";
import { sumEffectivePoints } from "./points";
import { pushToUser } from "@/lib/push/notify";

// ─── Helper: IDs de logros ya desbloqueados ───────────────────────────────

async function getUnlockedIds(userId: string): Promise<Set<string>> {
  // service role: funciona tanto desde server actions con sesión como desde crons
  // sin sesión (el evaluador match-settled opera sobre userId explícito, no auth.uid()).
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("user_achievement")
    .select("achievement_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.achievement_id));
}

// ─── Main: evaluar + persistir ────────────────────────────────────────────

/**
 * Evalúa y persiste logros recién desbloqueados para un usuario.
 *
 * @param scope  Contexto del evento que dispara la evaluación.
 * @param ctx    Datos del usuario y métricas necesarias para los triggers.
 * @returns      Lista de logros nuevos (para mostrar en UI / push).
 *
 * IMPORTANTE: Esta función usa createAdminClient() → service role.
 * El caller es responsable de verificar que ctx.userId es el usuario correcto
 * antes de invocar (crons: todos los usuarios; social actions: requireUser()).
 */
export async function processAchievements(
  scope: EventScope,
  ctx: TriggerContext
): Promise<
  Array<{ id: string; name: string; iconRef: string; pointsBonus: number; impact: string }>
> {
  const supabase = createAdminClient();
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

  // Bonus points — puntos EFECTIVOS desde la DB (editables por el admin).
  const totalBonus = await sumEffectivePoints(newlyUnlocked.map((r) => r.achievement.id));

  if (totalBonus > 0) {
    // fn_add_points está REVOCADA para authenticated (solo service_role puede ejecutarla).
    // Usamos admin client para no depender del RLS.
    const adminDb = createAdminClient();
    const { error: rpcErr } = await adminDb.rpc("fn_add_points", {
      p_user_id: ctx.userId,
      p_delta: totalBonus,
    });
    if (rpcErr) {
      // Fallback no atómico (también con service role, bypasa la restricción de UPDATE)
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

  // Notificaciones in-app (service role: la tabla notification no tiene INSERT policy
  // para usuarios → se insertan con admin client desde aquí y desde los triggers).
  const notifs = newlyUnlocked.map((r) => ({
    user_id: ctx.userId,
    type: "achievement-unlocked" as const,
    title: "Logro desbloqueado",
    body: `${r.achievement.name} · ${r.achievement.description}`,
    deep_link: `/app/perfil/logros#${r.achievement.id}`,
  }));
  await createAdminClient().from("notification").insert(notifs);

  // Push al dispositivo.
  const pushBody =
    newlyUnlocked.length === 1
      ? (newlyUnlocked[0]?.achievement.name ?? "Nuevo logro")
      : `Desbloqueaste ${newlyUnlocked.length} logros nuevos`;
  await pushToUser(ctx.userId, {
    title: "Logro desbloqueado",
    body: pushBody,
    deep_link: "/app/perfil/logros",
  });

  revalidateTag(`user-${ctx.userId}-achievements`);

  return newlyUnlocked.map((r) => ({
    id: r.achievement.id,
    name: r.achievement.name,
    iconRef: r.achievement.iconRef,
    pointsBonus: r.achievement.pointsBonus,
    impact: r.achievement.impact,
  }));
}
