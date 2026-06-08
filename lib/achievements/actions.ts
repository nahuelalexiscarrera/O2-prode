/**
 * O2 PRODE — Achievement Server Actions
 * Agente 11 · Gamification
 *
 * Exported Server Actions (seguras para llamar desde el cliente):
 *   · markAchievementShared — marca un logro como compartido (flow de share card)
 *
 * La función processAchievements fue movida a lib/achievements/process.ts
 * (API-003): al estar en un archivo "use server", Next.js la exponía como
 * endpoint RPC cifrado en /_next/action → cualquier cliente podía invocarla
 * con scope/userId arbitrario para auto-otorgarse logros. Al moverla a un
 * archivo sin "use server", solo puede importarse desde código server-side.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ACHIEVEMENT_BY_ID } from "./catalog";

// ─── markAchievementShared ────────────────────────────────────────────────

/**
 * Marca un logro del usuario autenticado como compartido.
 * Llamado desde el flow de share card (Agente 5) tras generar el PNG.
 * Puede desbloquear S03 "Embajador" (evaluado en lib/social/actions.ts).
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
