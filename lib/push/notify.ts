/**
 * O2 PRODE — Web Push fan-out helpers
 *
 * Envío de notificaciones push respetando las preferencias del socio. Toda la
 * lógica es defensiva: si algo falla (VAPID sin configurar, error de red, etc.)
 * devuelve 0 sin tirar, para no romper el cron / server action que lo llama.
 *
 * Las notificaciones in-app (tabla `notification`) las sigue insertando cada
 * caller; esto SOLO se encarga del push al dispositivo.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush, type PushPayload } from "@/lib/push/send";
import {
  getSubscriptionsForUser,
  removeStaleSubscription,
} from "@/lib/push/queries";
import { sendPushToUser } from "@/lib/push/send";

export type NotifPrefKey =
  | "matchReminders"
  | "results"
  | "socialReactions"
  | "weeklyDigest";

type SubRow = {
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
};

function prefAllows(
  prefs: Record<string, boolean> | null,
  prefKey: NotifPrefKey,
): boolean {
  // Default ON cuando la pref no existe (socio que nunca tocó settings).
  return prefs ? prefs[prefKey] !== false : true;
}

/**
 * Push a TODOS los socios suscriptos cuyo `prefKey` esté activo. Procesa solo
 * usuarios con suscripción → escala con la cantidad de suscriptos, no con los
 * ~800 socios. `targetUserIds` opcional acota el envío a un subconjunto (p.ej.
 * solo los que NO predijeron, para el recordatorio de partido).
 */
export async function broadcastPush(
  payload: PushPayload,
  prefKey: NotifPrefKey,
  targetUserIds?: string[],
): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data: subs } = await admin
      .from("push_subscription")
      .select("user_id, endpoint, p256dh_key, auth_key");
    if (!subs?.length) return 0;

    const target = targetUserIds ? new Set(targetUserIds) : null;
    const relevant = (subs as SubRow[]).filter(
      (s) => !target || target.has(s.user_id),
    );
    if (relevant.length === 0) return 0;

    const userIds = [...new Set(relevant.map((s) => s.user_id))];
    const { data: users } = await admin
      .from("user")
      .select("id, notification_prefs, deleted_at")
      .in("id", userIds);

    const allowed = new Map<string, boolean>();
    for (const u of users ?? []) {
      const prefs =
        (u.notification_prefs as Record<string, boolean> | null) ?? null;
      allowed.set(
        u.id as string,
        !u.deleted_at && prefAllows(prefs, prefKey),
      );
    }

    let sent = 0;
    await Promise.all(
      relevant.map(async (s) => {
        if (!allowed.get(s.user_id)) return;
        const res = await sendPush(
          { endpoint: s.endpoint, p256dh_key: s.p256dh_key, auth_key: s.auth_key },
          payload,
        );
        if (res.gone) await removeStaleSubscription(s.endpoint);
        if (res.ok) sent++;
      }),
    );
    return sent;
  } catch {
    return 0;
  }
}

/**
 * Push a un solo socio. `prefKey` opcional: si se omite, siempre intenta enviar
 * (caso de los logros, que no tienen una pref propia y son hitos infrecuentes).
 */
export async function pushToUser(
  userId: string,
  payload: PushPayload,
  prefKey?: NotifPrefKey,
): Promise<number> {
  try {
    if (prefKey) {
      const admin = createAdminClient();
      const { data: u } = await admin
        .from("user")
        .select("notification_prefs")
        .eq("id", userId)
        .maybeSingle();
      const prefs =
        (u?.notification_prefs as Record<string, boolean> | null) ?? null;
      if (!prefAllows(prefs, prefKey)) return 0;
    }
    return await sendPushToUser(
      userId,
      payload,
      getSubscriptionsForUser,
      removeStaleSubscription,
    );
  } catch {
    return 0;
  }
}
