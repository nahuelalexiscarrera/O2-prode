/**
 * O2 PRODE — Cliente Jira (server-only)
 *
 * Crea issues en Jira Cloud vía REST API v3. Requiere 4 env vars:
 *   JIRA_BASE_URL    = https://kaistudiodesigncraft.atlassian.net
 *   JIRA_EMAIL       = el email de la cuenta Atlassian
 *   JIRA_API_TOKEN   = token de id.atlassian.com/manage-profile/security/api-tokens
 *   JIRA_PROJECT_KEY = key del proyecto (ej. "SUP", "KAN")
 * Opcional: JIRA_ISSUE_TYPE (default "Task").
 *
 * Si falta alguna, isJiraConfigured() devuelve false y el ticket se guarda
 * solo localmente (degradación elegante, no rompe el flujo).
 */

const BASE = process.env.JIRA_BASE_URL?.replace(/\/$/, "");
const EMAIL = process.env.JIRA_EMAIL;
const TOKEN = process.env.JIRA_API_TOKEN;
const PROJECT = process.env.JIRA_PROJECT_KEY;
const ISSUE_TYPE = process.env.JIRA_ISSUE_TYPE || "Task";

export function isJiraConfigured(): boolean {
  return Boolean(BASE && EMAIL && TOKEN && PROJECT);
}

export interface JiraIssueInput {
  summary: string;
  description: string;
  severity: string;
  area?: string | null;
  ticketNumber: string;
  reporter?: string | null;
}

type JiraResult =
  | { ok: true; key: string; url: string }
  | { ok: false; error: string };

/** Párrafo ADF (Atlassian Document Format) a partir de texto plano. */
function adfParagraph(text: string) {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

export async function createJiraIssue(input: JiraIssueInput): Promise<JiraResult> {
  if (!isJiraConfigured()) return { ok: false, error: "Jira no configurado" };

  // Basic auth: base64(email:token). Buffer existe en el runtime nodejs.
  const auth = Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");

  const meta = `Severidad: ${input.severity}${input.area ? ` · Área: ${input.area}` : ""}`;
  const footer = `Ticket O2 PRODE: ${input.ticketNumber}${input.reporter ? ` · Reportó: ${input.reporter}` : ""}`;

  const body = {
    fields: {
      project: { key: PROJECT },
      summary: input.summary.slice(0, 250),
      description: {
        type: "doc",
        version: 1,
        content: [adfParagraph(input.description), adfParagraph(meta), adfParagraph(footer)],
      },
      issuetype: { name: ISSUE_TYPE },
      labels: ["o2-prode", `sev-${input.severity}`],
    },
  };

  try {
    const res = await fetch(`${BASE}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Jira ${res.status}: ${text.slice(0, 300)}` };
    }

    const data = (await res.json()) as { key?: string };
    if (!data.key) return { ok: false, error: "Jira no devolvió la key del issue" };
    return { ok: true, key: data.key, url: `${BASE}/browse/${data.key}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
