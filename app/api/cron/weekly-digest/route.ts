/**
 * POST /api/cron/weekly-digest
 *
 * Envía el resumen semanal de performance a los usuarios
 * que tienen weeklyDigest: true en sus preferencias.
 * Ejecutado los domingos a las 23:00 UTC (20:00 ART).
 * Protegido por Authorization: Bearer <CRON_SECRET>.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/send";
import { getSubscriptionsForUser, removeStaleSubscription } from "@/lib/push/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authOk(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch users with weeklyDigest enabled
  const { data: users, error: usersErr } = await supabase
    .from("user")
    .select("id, name, total_points, position, notification_prefs")
    .is("deleted_at", null);

  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 });

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartISO = weekStart.toISOString();

  const results: { userId: string }[] = [];

  for (const u of users ?? []) {
    const prefs = (u.notification_prefs as Record<string, boolean> | null) ?? {};
    if (!prefs["weeklyDigest"]) continue;

    const userId = u.id as string;

    // Count predictions made this week
    const { count: weeklyPreds } = await supabase
      .from("prediction")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", weekStartISO);

    const position = (u.position as number) ?? 0;
    const positionLabel = position > 0 ? `#${position}` : "sin clasificar";
    const predsLabel = weeklyPreds ?? 0;

    const notif = {
      user_id: userId,
      type: "weekly-digest" as const,
      title: "Tu semana en O2 PRODE",
      body: `${predsLabel} predicciones esta semana · Posición actual: ${positionLabel}`,
      deep_link: "/app/perfil",
    };

    await supabase.from("notification").insert(notif);

    await sendPushToUser(
      userId,
      { title: notif.title, body: notif.body, deep_link: notif.deep_link },
      getSubscriptionsForUser,
      removeStaleSubscription,
    );

    results.push({ userId });
  }

  return NextResponse.json({ ok: true, sent: results.length });
}
