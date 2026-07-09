/**
 * POST /api/admin/notify-quarter-open
 *
 * Disparo ÚNICO: avisar a TODOS los socios activos que la fase de Cuartos está
 * abierta. Los 4 cruces ya existen en `match` con equipos definidos (fr-ma,
 * es-be, no-gb-eng, ar-ch) y el fix del gate visual quedó live en el commit
 * bc6f9ea.
 *
 * - Notificación in-app (tabla `notification`) a la cohorte completa.
 * - Push a los suscriptos (broadcastPush, respeta prefs). Con 0 subs en prod hoy
 *   el push efectivo es 0, pero el código queda simétrico con la campaña previa.
 * - Idempotente: saltea a quien ya recibió esta campaña (dedupe por title).
 * - Protegido por Authorization: Bearer <CRON_SECRET> (mismo patrón).
 *
 * Se invoca a mano UNA vez, después de que este endpoint esté live:
 *   curl -X POST .../api/admin/notify-quarter-open -H "Authorization: Bearer $CRON_SECRET"
 */

import { timingSafeEqual } from "node:crypto";
import { broadcastPush } from "@/lib/push/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CAMPAIGN = {
  title: "Cuartos de final abierto",
  body: "Se habilitó la fase. Cargá tus predicciones hasta 20 minutos antes de cada partido.",
  deep_link: "/app/prode/eliminatorias",
  type: "phase-start" as const,
  tag: "phase-quarter-open",
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

async function handle(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1) Cohorte: TODOS los socios activos (no borrados).
  const { data: users, error: uErr } = await admin.from("user").select("id").is("deleted_at", null);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  const cohort = (users ?? []).map((u) => u.id as string);
  if (cohort.length === 0) {
    return NextResponse.json({
      ok: true,
      cohort: 0,
      notified: 0,
      pushed: 0,
      note: "cohorte vacía",
    });
  }

  // 2) Idempotencia: no re-notificar a quien ya recibió esta campaña (dedupe por title).
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

  // 3) Insert in-app + push, BATCH POR BATCH (de a 100), en lockstep:
  // - Si el insert de un batch falla, ABORTAMOS antes de pushear ese batch.
  // - El push de un batch va SOLO después de que su insert entró OK, así nunca
  //   se pushea a alguien cuyo in-app no se guardó.
  // Un re-run es idempotente (dedupe por title) y completa lo que falte sin
  // duplicar. NOTA OPERATIVA: disparar esta ruta UNA sola vez en serie — el
  // dedupe es read-then-write sin lock, así que dos disparos CONCURRENTES
  // (doble-click / retry) podrían ambos notificar.
  const rows = toNotify.map((user_id) => ({
    user_id,
    type: CAMPAIGN.type,
    title: CAMPAIGN.title,
    body: CAMPAIGN.body,
    deep_link: CAMPAIGN.deep_link,
  }));
  const payload = {
    title: CAMPAIGN.title,
    body: CAMPAIGN.body,
    deep_link: CAMPAIGN.deep_link,
    tag: CAMPAIGN.tag,
  };
  let notified = 0;
  let pushed = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const slice = rows.slice(i, i + 100);
    const { error: insErr } = await admin.from("notification").insert(slice);
    if (insErr) {
      return NextResponse.json(
        {
          ok: false,
          error: `Falló el insert de notificaciones (batch ${i / 100}): ${insErr.message}`,
          notified,
          pushed,
          hint: "Re-ejecutá la ruta: es idempotente (dedupe por title) y completa lo que falta sin duplicar.",
        },
        { status: 500 }
      );
    }
    notified += slice.length;
    pushed += await broadcastPush(
      payload,
      "matchReminders",
      slice.map((r) => r.user_id)
    );
  }

  return NextResponse.json({ ok: true, cohort: cohort.length, notified, pushed });
}

export const POST = handle;
