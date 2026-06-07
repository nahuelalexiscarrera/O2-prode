import webpush from "web-push";

// VAPID lazy: si las claves no están configuradas, importar este módulo NO
// debe romper (varios crons críticos lo importan, p.ej. sync-results). En ese
// caso el push simplemente no se envía y se degrada en silencio.
let vapidState: boolean | null = null;
function ensureVapid(): boolean {
  if (vapidState !== null) return vapidState;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    vapidState = false;
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:contacto@o2-prode.app",
    pub,
    priv,
  );
  vapidState = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  deep_link?: string;
  /**
   * Agrupa notificaciones: dos pushes con el mismo `tag` se reemplazan en la
   * bandeja en vez de apilarse. Sin tag, cada push genera una notificación nueva
   * y se acumulan (B6). El SW usa "o2-prode" como fallback.
   */
  tag?: string;
}

interface Subscription {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

export async function sendPush(
  sub: Subscription,
  payload: PushPayload,
): Promise<{ ok: boolean; gone?: boolean }> {
  if (!ensureVapid()) return { ok: false };
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
      JSON.stringify(payload),
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 410 || statusCode === 404) return { ok: false, gone: true };
    return { ok: false };
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  getSubscriptions: (id: string) => Promise<Subscription[]>,
  removeStale: (endpoint: string) => Promise<void>,
): Promise<number> {
  const subs = await getSubscriptions(userId);
  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      const result = await sendPush(sub, payload);
      if (result.gone) await removeStale(sub.endpoint);
      if (result.ok) sent++;
    }),
  );
  return sent;
}
