import { createAdminClient } from "@/lib/supabase/admin";
import { isJiraConfigured } from "@/lib/jira/client";

export type SupportTicketRow = {
  id: string;
  ticket_number: string;
  title: string;
  severity: string;
  status: string;
  area: string | null;
  jira_url: string | null;
  created_at: string;
};

/** Tickets recientes (solo se llama desde páginas ya gated por getIsAdmin). */
export async function getSupportTickets(limit = 50): Promise<SupportTicketRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("support_ticket")
    .select("id, ticket_number, title, severity, status, area, jira_url, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as SupportTicketRow[];
}

export type ErrorEventRow = {
  id: string;
  kind: string;
  message: string;
  route: string | null;
  count: number;
  status: string;
  jira_url: string | null;
  last_seen: string;
};

/** Errores auto-capturados (deduplicados), ordenados por más recientes. */
export async function getErrorEvents(limit = 50): Promise<ErrorEventRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("error_event")
    .select("id, kind, message, route, count, status, jira_url, last_seen")
    .order("last_seen", { ascending: false })
    .limit(limit);
  return (data ?? []) as ErrorEventRow[];
}

export { isJiraConfigured };
