import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:contacto@o2-prode.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload {
  title: string;
  body: string;
  deep_link?: string;
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
