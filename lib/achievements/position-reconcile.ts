/**
 * O2 PRODE — Reconciliación ranking-wide de logros de posición (P01-P03).
 *
 * Los logros de posición (Top 10 / Podio / Líder) dependen del ranking GLOBAL,
 * no de las predicciones de un partido puntual. Cuando se carga o corrige un
 * resultado, fn_recalculate_positions reordena la posición de ~todos los socios,
 * no solo de los que predijeron ese partido. Por eso NO pueden vivir en el path
 * por-predictor (match-settled): un socio que NO predijo el partido pero cruzó un
 * umbral (p.ej. pasó de #11 a #10, o perdió el #1) nunca se re-evaluaría.
 *
 * Esta pasada recorre a TODOS los socios activos y deja sus logros de posición en
 * sincronía con su posición ACTUAL:
 *   - otorga P01-P03 a quien ahora califica y no los tenía,
 *   - revoca P01-P03 a quien dejó de calificar (y revierte su bonus, neto 0).
 *
 * Es idempotente (solo toca diffs) y barata: un puñado de queries + cómputo en
 * memoria, no N queries por socio. Se llama tras cada settle/resettle, DESPUÉS de
 * evaluateMatchSettledForUsers (que puede mover puntos con los bonus de skill y
 * reordenar el ranking otra vez) para leer las posiciones finales.
 */

import { pushToUser } from "@/lib/push/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";
import { ACHIEVEMENT_BY_ID } from "./catalog";
import { POSITION_ACHIEVEMENT_IDS, positionAchievementIdsFor } from "./triggers";

// ─── Diff puro (sin DB, testeable) ───────────────────────────────────

export interface PositionRow {
  userId: string;
  position: number;
}

export interface PositionDiff {
  /** logros a otorgar (el socio califica y no los tenía) */
  awards: Array<{ userId: string; achievementId: string }>;
  /** logros a revocar (el socio los tenía y ya no califica) */
  revokes: Array<{ userId: string; achievementId: string }>;
}

const POSITION_ID_SET = new Set(POSITION_ACHIEVEMENT_IDS);

/**
 * Calcula qué logros de posición otorgar/revocar comparando, por socio, el
 * conjunto "merecido" según su posición actual contra el que ya tiene.
 *
 * `heldByUser` debe contener SOLO logros de posición (P01-P03); igual filtramos
 * por las dudas para no revocar nunca un logro de otro scope.
 */
export function diffPositionAchievements(
  rows: readonly PositionRow[],
  heldByUser: ReadonlyMap<string, ReadonlySet<string>>
): PositionDiff {
  const awards: PositionDiff["awards"] = [];
  const revokes: PositionDiff["revokes"] = [];

  for (const { userId, position } of rows) {
    const deserved = new Set(positionAchievementIdsFor(position));
    const held = heldByUser.get(userId) ?? new Set<string>();

    // Otorgar: merecido − ya tiene
    for (const id of deserved) {
      if (!held.has(id)) awards.push({ userId, achievementId: id });
    }
    // Revocar: tiene (de posición) − merecido
    for (const id of held) {
      if (POSITION_ID_SET.has(id) && !deserved.has(id)) {
        revokes.push({ userId, achievementId: id });
      }
    }
  }

  return { awards, revokes };
}

// ─── Pasada con DB ───────────────────────────────────────────────────

/**
 * Reconcilia P01-P03 para todos los socios activos contra su posición actual.
 * Otorga / revoca según corresponda, manteniendo `total_points` consistente
 * (cada logro suma su bonus efectivo exactamente una vez) y es idempotente.
 */
export async function reconcilePositionAchievements(): Promise<void> {
  if (POSITION_ACHIEVEMENT_IDS.length === 0) return;
  const admin = createAdminClient();

  // 1) socios activos + su posición actual (post-recálculo del ranking)
  const { data: users } = await admin.from("user").select("id, position").is("deleted_at", null);
  if (!users?.length) return;

  // 2) logros de posición ya otorgados (solo esos IDs)
  const { data: heldRows } = await admin
    .from("user_achievement")
    .select("user_id, achievement_id")
    .in("achievement_id", POSITION_ACHIEVEMENT_IDS as string[]);

  const heldByUser = new Map<string, Set<string>>();
  for (const r of heldRows ?? []) {
    const uid = r.user_id as string;
    const set = heldByUser.get(uid) ?? new Set<string>();
    set.add(r.achievement_id as string);
    heldByUser.set(uid, set);
  }

  // 3) bonus efectivo por logro (admin-editable; default 0 = insignia sin puntos)
  const { data: cat } = await admin
    .from("achievement_catalog")
    .select("id, points_bonus")
    .in("id", POSITION_ACHIEVEMENT_IDS as string[]);
  const bonusById = new Map<string, number>(
    (cat ?? []).map((c) => [c.id as string, (c.points_bonus as number) ?? 0])
  );
  const effectiveBonus = (achId: string): number =>
    bonusById.has(achId)
      ? (bonusById.get(achId) as number)
      : (ACHIEVEMENT_BY_ID.get(achId)?.pointsBonus ?? 0);

  // 4) diff
  const rows: PositionRow[] = users.map((u) => ({
    userId: u.id as string,
    position: (u.position as number) ?? 0,
  }));
  const { awards, revokes } = diffPositionAchievements(rows, heldByUser);
  if (awards.length === 0 && revokes.length === 0) return;

  // Delta de puntos neto por socio (otorga suma, revoca resta). Con el default 0
  // todo queda en 0 y no se llama a fn_add_points (no recalcula posiciones → sin
  // cascada). Si un admin pone bonus > 0, igual queda consistente y net-zero.
  const pointDelta = new Map<string, number>();
  const addDelta = (uid: string, d: number) => pointDelta.set(uid, (pointDelta.get(uid) ?? 0) + d);

  // 5) REVOKES — borrar filas (agrupado por logro: ≤3 deletes) y restar bonus
  if (revokes.length > 0) {
    const usersByAch = new Map<string, string[]>();
    for (const { userId, achievementId } of revokes) {
      const arr = usersByAch.get(achievementId) ?? [];
      arr.push(userId);
      usersByAch.set(achievementId, arr);
      addDelta(userId, -effectiveBonus(achievementId));
    }
    for (const [achId, uids] of usersByAch) {
      await admin.from("user_achievement").delete().eq("achievement_id", achId).in("user_id", uids);
    }
  }

  // 6) AWARDS — insertar filas (chunked), sumar bonus, notif + push
  if (awards.length > 0) {
    const nowIso = new Date().toISOString();
    const insertRows = awards.map(({ userId, achievementId }) => {
      addDelta(userId, effectiveBonus(achievementId));
      return {
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: nowIso,
        shared: false,
      };
    });
    for (let i = 0; i < insertRows.length; i += 100) {
      await admin.from("user_achievement").insert(insertRows.slice(i, i + 100));
    }

    // Notificaciones in-app (chunked). service role: la tabla notification no
    // tiene policy de INSERT para usuarios → se inserta con privilegios de server.
    const notifRows = awards.map(({ userId, achievementId }) => {
      const ach = ACHIEVEMENT_BY_ID.get(achievementId);
      return {
        user_id: userId,
        type: "achievement-unlocked" as const,
        title: "Logro desbloqueado",
        body: `${ach?.name ?? "Nuevo logro"} · ${ach?.description ?? ""}`,
        deep_link: `/app/perfil/logros#${achievementId}`,
      };
    });
    for (let i = 0; i < notifRows.length; i += 100) {
      await admin.from("notification").insert(notifRows.slice(i, i + 100));
    }
  }

  // 7) Aplicar el delta de puntos por socio (solo si ≠ 0 → con bonus 0 es no-op).
  for (const [uid, delta] of pointDelta) {
    if (delta !== 0) await admin.rpc("fn_add_points", { p_user_id: uid, p_delta: delta });
  }

  // 8) Push (1 por socio que ganó logros) + invalidar cache de logros del socio.
  const awardedByUser = new Map<string, string[]>();
  for (const { userId, achievementId } of awards) {
    const arr = awardedByUser.get(userId) ?? [];
    arr.push(achievementId);
    awardedByUser.set(userId, arr);
  }
  for (const [uid, achIds] of awardedByUser) {
    const body =
      achIds.length === 1
        ? (ACHIEVEMENT_BY_ID.get(achIds[0] as string)?.name ?? "Nuevo logro")
        : `Desbloqueaste ${achIds.length} logros nuevos`;
    await pushToUser(uid, {
      title: "Logro desbloqueado",
      body,
      deep_link: "/app/perfil/logros",
    });
    revalidateTag(`user-${uid}-achievements`);
  }
  // Los socios que solo perdieron logros también deben refrescar su lista.
  const revokeOnly = new Set<string>();
  for (const { userId } of revokes) {
    if (!awardedByUser.has(userId)) revokeOnly.add(userId);
  }
  for (const uid of revokeOnly) revalidateTag(`user-${uid}-achievements`);
}
