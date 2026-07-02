/**
 * O2 PRODE — Envío del reporte de fase por email (brief §3 sendEmail).
 *
 * Reusa la convención de lib/email/send.ts: fetch directo a api.resend.com
 * (no el SDK). UN solo destinatario fijo (la agencia) — NO fan-out a admins.
 * Destino: REPORT_RECIPIENT, con fallback a SUPPORT_EMAIL_TO (ya configurado).
 * Cuerpo: tabla HTML clásica (Outlook/Gmail dark+light) con KPIs como texto
 * (para clientes que bloquean imágenes) + PNG adjunto + link al HTML completo.
 * Si falta RESEND_API_KEY, no se envía y se reporta el motivo (no rompe).
 *
 * Nota Resend: con el dominio compartido onboarding@resend.dev solo se puede
 * enviar al email de la cuenta Resend (la de la agencia) sin verificar dominio.
 */

import { REPORTS } from "@/lib/i18n/reports";
import { O2_BRAND } from "./branding";
import type { PhaseMetrics } from "./types";

export interface EmailResult {
  sent: boolean;
  skippedReason?: string;
  recipients: string[];
}

const intEs = (n: number) => Math.round(n).toLocaleString("es-AR");
const decEs = (n: number) => n.toFixed(1).replace(".", ",");

function recipient(): string {
  return (
    process.env.REPORT_RECIPIENT ||
    process.env.SUPPORT_EMAIL_TO ||
    "kaistudio.designcraft@gmail.com"
  );
}
function from(): string {
  return (
    process.env.REPORT_FROM || process.env.SUPPORT_EMAIL_FROM || "O2 PRODE <onboarding@resend.dev>"
  );
}

function kpiRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px;color:#8A8A90;border-bottom:1px solid #26262B;">${label}</td>
    <td style="padding:8px 12px;color:#F5F5F5;font-weight:700;text-align:right;border-bottom:1px solid #26262B;">${value}</td>
  </tr>`;
}

function emailBody(m: PhaseMetrics, htmlUrl: string | null): string {
  const c = REPORTS.phase.email;
  const b = O2_BRAND;
  const link = htmlUrl
    ? `<p style="margin:20px 0;"><a href="${htmlUrl}" style="display:inline-block;background:${b.accentColor};color:#0B0B0D;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">${c.linkLabel}</a></p>`
    : "";
  return `<div style="background:${b.bgColor};color:${b.textColor};font-family:Arial,Helvetica,sans-serif;padding:24px;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="font-size:13px;letter-spacing:2px;color:${b.mutedColor};text-transform:uppercase;margin:0 0 8px;">${b.productName}</p>
    <p style="margin:0 0 4px;">${c.greeting}</p>
    <p style="margin:0 0 16px;color:${b.textColor};">${c.bodyIntro.replace("{phaseLabel}", m.phaseLabel)}</p>
    <p style="font-size:18px;color:${b.accentColor};font-weight:700;margin:0 0 12px;">${m.headlineSummary}</p>
    <p style="margin:0 0 6px;color:${b.mutedColor};">${c.kpiIntro}</p>
    <table style="width:100%;border-collapse:collapse;background:${b.cardColor};border-radius:8px;overflow:hidden;">
      <tbody>
        ${kpiRow(REPORTS.phase.kpiLabels.activeUsers, intEs(m.kpis.activeUsers.current))}
        ${kpiRow(REPORTS.phase.kpiLabels.predictionsLoaded, intEs(m.kpis.predictionsLoaded.current))}
        ${kpiRow(REPORTS.phase.kpiLabels.newUsers, intEs(m.kpis.newUsers.current))}
        ${kpiRow(REPORTS.phase.kpiLabels.participation, `${decEs(m.kpis.participation.current)}%`)}
      </tbody>
    </table>
    ${link}
    <p style="margin:16px 0 0;color:${b.mutedColor};font-size:12px;">${b.footerLabel} — ${c.signOff}</p>
  </div>
</div>`;
}

export async function sendPhaseReportEmail(
  m: PhaseMetrics,
  opts: { png: Uint8Array; htmlUrl: string | null }
): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, skippedReason: "RESEND_API_KEY ausente", recipients: [] };

  const to = recipient();
  const subject = REPORTS.phase.email.subjectTemplate.replace("{phaseLabel}", m.phaseLabel);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: from(),
      to: [to],
      subject: subject.slice(0, 200),
      html: emailBody(m, opts.htmlUrl),
      attachments: [
        { filename: `reporte-${m.phase}.png`, content: Buffer.from(opts.png).toString("base64") },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
  return { sent: true, recipients: [to] };
}
