/**
 * O2 PRODE — Envío de email de soporte (server-only)
 *
 * Usa Resend (https://resend.com) — mucho más simple que Jira: 1 sola API key.
 * Env vars:
 *   RESEND_API_KEY     = la API key de Resend (resend.com/api-keys)
 *   SUPPORT_EMAIL_TO   = destino (default kaistudio.designcraft@gmail.com)
 *   SUPPORT_EMAIL_FROM = remitente (default O2 PRODE <onboarding@resend.dev>)
 *
 * Con el dominio compartido onboarding@resend.dev se puede enviar al MISMO email
 * de la cuenta Resend sin verificar dominio → arranca sin fricción.
 * Si falta RESEND_API_KEY, el ticket se guarda local igual (no rompe).
 */

const KEY = process.env.RESEND_API_KEY;
const TO = process.env.SUPPORT_EMAIL_TO || "kaistudio.designcraft@gmail.com";
const FROM = process.env.SUPPORT_EMAIL_FROM || "O2 PRODE <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(KEY);
}

const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};
function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ESCAPE[c] ?? c);
}

export interface SupportEmail {
  subject: string;
  /** Cada línea es un párrafo. */
  lines: string[];
}

type SendResult = { ok: true; id: string } | { ok: false; error: string };

export async function sendSupportEmail(email: SupportEmail): Promise<SendResult> {
  if (!KEY) return { ok: false, error: "Email no configurado" };

  const rows = email.lines.map((l) => `<p style="margin:0 0 10px">${escapeHtml(l)}</p>`).join("");
  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#111">${rows}</div>`;
  const text = email.lines.join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        subject: email.subject.slice(0, 200),
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id ?? "sent" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
