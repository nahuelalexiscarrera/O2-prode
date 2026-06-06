/**
 * O2 PRODE — Auto-captura de errores (server-only, core)
 *
 * Anti-sobrecarga (3 capas):
 *  1. Filtro de ruido: errores transitorios/de extensiones se descartan.
 *  2. Dedup por fingerprint: el mismo error se agrupa (count++), NO crea otro
 *     issue. Solo la PRIMERA aparición de un fingerprint puede ir a Jira.
 *  3. Presupuesto horario: máx N issues automáticos por hora (default 8). Si un
 *     deploy rompe todo y aparecen 50 errores distintos, se registran igual pero
 *     se cap-ean los issues de Jira para no inundar el tablero.
 *
 * Nunca tira: es fire-and-forget.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendSupportEmail, isEmailConfigured } from "@/lib/email/send";

const NOISE: RegExp[] = [
  /resizeobserver/i,
  /^script error\.?$/i,
  /failed to fetch|networkerror|load failed|network connection was lost|the operation was aborted|aborterror/i,
  /loading chunk \d+ failed|chunkloaderror|importing a module script failed|failed to fetch dynamically imported module/i,
  /chrome-extension:\/\/|moz-extension:\/\/|safari-extension:\/\//i,
];

/** Errores que no vale la pena registrar (ruido transitorio o de terceros). */
export function isNoise(message: string): boolean {
  return NOISE.some((re) => re.test(message));
}

function normalize(msg: string): string {
  return msg
    .toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "#uuid")
    .replace(/0x[0-9a-f]+/g, "#hex")
    .replace(/https?:\/\/[^\s"')]+/g, "#url")
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function topFrame(stack?: string | null): string {
  if (!stack) return "";
  const line = stack.split("\n").find((l) => /\bat\b|@/.test(l)) ?? "";
  return line
    .replace(/:\d+:\d+/g, "")
    .replace(/https?:\/\/[^\s)]+/g, "")
    .trim()
    .slice(0, 120);
}

/** djb2 — hash estable y sincrónico (sirve en node y edge, sin crypto async). */
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

// Tope de emails de error AUTOMÁTICOS por hora — clave para no inundar el inbox
// si un deploy rompe muchas cosas a la vez. El resto se registra sin notificar.
const EMAIL_BUDGET = Number(process.env.AUTO_ERROR_EMAIL_BUDGET ?? "8");

export interface ErrorReport {
  kind: "server" | "client";
  message: string;
  stack?: string | null;
  route?: string | null;
}

export async function recordError(r: ErrorReport): Promise<void> {
  try {
    if (process.env.AUTO_ERROR_REPORTING === "off") return;

    const message = String(r.message ?? "").slice(0, 2000);
    if (!message || isNoise(message)) return;

    const route = r.route ? String(r.route).slice(0, 200) : null;
    const fingerprint = hash(`${r.kind}|${normalize(message)}|${route ?? ""}|${topFrame(r.stack)}`);

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("fn_record_error", {
      p_fingerprint: fingerprint,
      p_kind: r.kind,
      p_message: message,
      p_route: route,
      p_stack: r.stack ?? null,
    });
    if (error) return;

    const row = (Array.isArray(data) ? data[0] : data) as
      | { is_new?: boolean; ev_count?: number }
      | null;
    if (!row?.is_new || !isEmailConfigured()) return;

    // Presupuesto horario: no más de N emails automáticos por hora.
    // (jira_issue_key se reusa como marca de "ya notificado".)
    const sinceISO = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await admin
      .from("error_event")
      .select("id", { count: "exact", head: true })
      .not("jira_issue_key", "is", null)
      .gte("first_seen", sinceISO);
    if ((count ?? 0) >= EMAIL_BUDGET) return; // se registró igual, sin mail

    const mail = await sendSupportEmail({
      subject: `[O2 PRODE][AUTO][${r.kind}] ${message}`.slice(0, 200),
      lines: [
        `Tipo: ${r.kind === "server" ? "Servidor" : "Cliente"}`,
        `Ruta: ${route ?? "—"}`,
        "",
        `Mensaje: ${message}`,
        "",
        "Stack:",
        (r.stack ?? "—").slice(0, 1500),
      ],
    });
    if (mail.ok) {
      await admin
        .from("error_event")
        .update({ jira_issue_key: mail.id })
        .eq("fingerprint", fingerprint);
    }
  } catch {
    // fire-and-forget: nunca propaga al caller.
  }
}
