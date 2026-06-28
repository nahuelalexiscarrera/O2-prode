/**
 * POST /api/admin/notify-knockout
 *
 * Disparo ÚNICO de compensación: avisar a los socios ACTIVOS que jugaron grupos
 * pero no encontraron 16avos (el candado de la tab "Eliminatorias" los confundió)
 * que la sección está abierta y el plazo se amplió a 20 min antes de cada partido.
 *
 * - Push a los suscriptos (broadcastPush, respeta prefs) + notificación in-app a
 *   toda la cohorte (la ve cualquiera que abra la app).
 * - Idempotente: saltea a quien ya recibió esta campaña (no re-notifica).
 * - Protegido por Authorization: Bearer <CRON_SECRET> (mismo patrón que los crons).
 *
 * Se invoca a mano UNA vez, DESPUÉS de que el fix (candado + 20 min) esté live:
 *   curl -X POST .../api/admin/notify-knockout -H "Authorization: Bearer $CRON_SECRET"
 */

import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastPush } from "@/lib/push/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CAMPAIGN = {
  title: "Eliminatorias está abierto",
  body: "Ampliamos el plazo: tenés hasta 20 minutos antes de cada partido para cargar tus 16avos.",
  deep_link: "/app/prode/eliminatorias",
  type: "phase-start" as const,
  tag: "comp-r32",
};

function authOk(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

type Admin = ReturnType<typeof createAdminClient>;

/** Set de user_id que tienen ≥1 predicción en los partidos dados (paginado). */
async function predictorSet(admin: Admin, matchIds: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  if (matchIds.length === 0) return set;
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await admin
      .from("prediction")
      .select("user_id")
      .in("match_id", matchIds)
      .order("user_id", { ascending: true })
      .range(from, from + size - 1);
    if (error || !data?.length) break;
    for (const r of data) set.add(r.user_id as string);
    if (data.length < size) break;
  }
  return set;
}

async function handle(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1) Partidos por fase
  const { data: matches, error: mErr } = await admin
    .from("match")
    .select("id, phase")
    .in("phase", ["groups", "round-of-32"]);
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  const grpIds = (matches ?? []).filter((m) => m.phase === "groups").map((m) => m.id as string);
  const r32Ids = (matches ?? []).filter((m) => m.phase === "round-of-32").map((m) => m.id as string);
  if (r32Ids.length === 0) {
    return NextResponse.json({ error: "No hay partidos de round-of-32 todavía." }, { status: 400 });
  }

  // 2) Predictores de grupos (activos) y de 16avos (a excluir)
  const groupPredictors = await predictorSet(admin, grpIds);
  const r32Predictors = await predictorSet(admin, r32Ids);

  // 3) Socios activos
  const { data: users, error: uErr } = await admin
    .from("user")
    .select("id")
    .is("deleted_at", null);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  // 4) Cohorte: activos que jugaron grupos y NO predijeron 16avos
  const cohort = (users ?? [])
    .map((u) => u.id as string)
    .filter((id) => groupPredictors.has(id) && !r32Predictors.has(id));

  if (cohort.length === 0) {
    return NextResponse.json({ ok: true, cohort: 0, notified: 0, pushed: 0, note: "cohorte vacía" });
  }

  // 5) Idempotencia: no re-notificar a quien ya recibió esta campaña
  const { data: already } = await admin
    .from("notification")
    .select("user_id")
    .eq("title", CAMPAIGN.title)
    .in("user_id", cohort);
  const alreadySet = new Set((already ?? []).map((n) => n.user_id as string));
  const toNotify = cohort.filter((id) => !alreadySet.has(id));

  if (toNotify.length === 0) {
    return NextResponse.json({
      ok: true,
      cohort: cohort.length,
      notified: 0,
      pushed: 0,
      note: "todos ya estaban notificados (idempotente)",
    });
  }

  // 6) Notificación in-app (batch de 100)
  const rows = toNotify.map((user_id) => ({
    user_id,
    type: CAMPAIGN.type,
    title: CAMPAIGN.title,
    body: CAMPAIGN.body,
    deep_link: CAMPAIGN.deep_link,
  }));
  for (let i = 0; i < rows.length; i += 100) {
    await admin.from("notification").insert(rows.slice(i, i + 100));
  }

  // 7) Push a los suscriptos de la cohorte (respeta prefs)
  const pushed = await broadcastPush(
    { title: CAMPAIGN.title, body: CAMPAIGN.body, deep_link: CAMPAIGN.deep_link, tag: CAMPAIGN.tag },
    "matchReminders",
    toNotify,
  );

  return NextResponse.json({ ok: true, cohort: cohort.length, notified: toNotify.length, pushed });
}

export const POST = handle;
