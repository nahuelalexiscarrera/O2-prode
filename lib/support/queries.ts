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

export { isJiraConfigured };
