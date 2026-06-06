/**
 * O2 PRODE — Puntos efectivos de logros.
 *
 * Los puntos bonus de cada logro los puede editar el admin desde el panel
 * (tabla achievement_catalog.points_bonus). El awarding (processAchievements y
 * los crons) usa ESTA fuente, no el valor hardcodeado del catálogo — así el
 * admin controla cuánto suma cada logro sin tocar código.
 *
 * Fallback: si una fila no está en la DB (logro nuevo aún no seedeado), cae al
 * pointsBonus por defecto del catálogo en código.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { ACHIEVEMENT_BY_ID } from "./catalog";

export async function sumEffectivePoints(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const admin = createAdminClient();
  const { data } = await admin
    .from("achievement_catalog")
    .select("id, points_bonus")
    .in("id", ids);
  const dbPoints = new Map(
    (data ?? []).map((r) => [r.id as string, r.points_bonus as number]),
  );
  let sum = 0;
  for (const id of ids) {
    sum += dbPoints.has(id)
      ? (dbPoints.get(id) as number)
      : (ACHIEVEMENT_BY_ID.get(id)?.pointsBonus ?? 0);
  }
  return sum;
}
