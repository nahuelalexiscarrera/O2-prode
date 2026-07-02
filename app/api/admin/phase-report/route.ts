/**
 * POST /api/admin/phase-report  — genera y envía el reporte de una fase.
 * Auth: Bearer CRON_SECRET (timing-safe). Body: { phase }.
 *
 * Pipeline (brief §3): computeMetrics → renderHTML → renderPNG → subir a Storage
 * (bucket `reports`) → enviar email (Resend, destinatario único) → log.
 * Idempotente: phase_report_log tiene UNIQUE(tournament_id, phase).
 */

import { timingSafeEqual } from "node:crypto";
import { computeMetrics } from "@/lib/reports/phase/computeMetrics";
import { renderHTML } from "@/lib/reports/phase/renderHTML";
import { renderPNG } from "@/lib/reports/phase/renderPNG";
import { sendPhaseReportEmail } from "@/lib/reports/phase/sendEmail";
import { PHASE_ORDER, type TournamentPhase } from "@/lib/reports/phase/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const VALID = new Set<string>(PHASE_ORDER);
const SIGNED_URL_TTL = 60 * 60 * 24 * 30; // 30 días

function authorized(req: Request): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET ?? "";
  const provided = Buffer.from(auth.replace("Bearer ", ""));
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let phase: string | undefined;
  try {
    phase = (await req.json())?.phase;
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }
  if (!phase || !VALID.has(phase))
    return Response.json({ error: `phase inválida: ${phase}` }, { status: 400 });

  const admin = createAdminClient();

  const { data: tournament, error: tErr } = await admin
    .from("tournament")
    .select("id")
    .eq("active", true)
    .single();
  if (tErr || !tournament) return Response.json({ error: "No hay torneo activo" }, { status: 500 });

  // Idempotencia: si ya se reportó esta fase, no re-mandar.
  const { data: existing } = await admin
    .from("phase_report_log")
    .select("id, sent_at")
    .eq("tournament_id", tournament.id)
    .eq("phase", phase)
    .maybeSingle();
  if (existing)
    return Response.json({ ok: true, phase, skipped: "already-sent", sentAt: existing.sent_at });

  // Pipeline.
  const metrics = await computeMetrics(phase as TournamentPhase);
  const html = renderHTML(metrics);
  const origin = new URL(req.url).origin;
  const png = await renderPNG(metrics, origin);

  const periodSlug = metrics.periodEnd.slice(0, 10);
  const htmlPath = `phase/${phase}-${periodSlug}.html`;
  const pngPath = `phase/${phase}-${periodSlug}.png`;

  const bucket = admin.storage.from("reports");
  const upHtml = await bucket.upload(htmlPath, html, { upsert: true, contentType: "text/html" });
  const upPng = await bucket.upload(pngPath, png, { upsert: true, contentType: "image/png" });
  if (upHtml.error || upPng.error)
    return Response.json(
      { error: `Storage: ${upHtml.error?.message ?? upPng.error?.message}` },
      { status: 500 }
    );

  const { data: signed } = await bucket.createSignedUrl(htmlPath, SIGNED_URL_TTL);
  const htmlUrl = signed?.signedUrl ?? null;

  // Email (destinatario único). Si no hay credenciales, se saltea sin romper.
  let email: Awaited<ReturnType<typeof sendPhaseReportEmail>>;
  try {
    email = await sendPhaseReportEmail(metrics, { png, htmlUrl });
  } catch (e) {
    email = { sent: false, skippedReason: `Resend error: ${(e as Error).message}`, recipients: [] };
  }

  // Log (gate de idempotencia). Si otra corrida ganó la carrera (UNIQUE), lo tratamos como enviado.
  const { error: logErr } = await admin.from("phase_report_log").insert({
    tournament_id: tournament.id,
    phase,
    period_start: metrics.periodStart,
    period_end: metrics.periodEnd,
    html_path: htmlPath,
    png_path: pngPath,
    recipients: email.recipients,
    status: email.sent ? "sent" : "partial",
    error: email.skippedReason ?? null,
  });
  if (logErr && !logErr.message.includes("duplicate"))
    return Response.json({ error: `Log: ${logErr.message}` }, { status: 500 });

  return Response.json({
    ok: true,
    phase,
    htmlPath,
    pngPath,
    htmlUrl,
    emailed: email.sent,
    emailSkipped: email.skippedReason ?? null,
  });
}
