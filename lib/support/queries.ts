import { createAdminClient } from "@/lib/supabase/admin";

export type SupportTicketRow = {
  id: string;
  ticket_number: string;
  title: string;
  severity: string;
  status: string;
  area: string | null;
  created_at: string;
};

/** Tickets recientes (solo se llama desde páginas ya gated por getIsAdmin). */
export async function getSupportTickets(limit = 50): Promise<SupportTicketRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("support_ticket")
    .select("id, ticket_number, title, severity, status, area, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as SupportTicketRow[];
}

// NOTA: los errores auto-capturados (tabla error_event) NO se exponen en el panel
// de admin a propósito — los moderadores/clientes verían fallas técnicas y eso
// genera desconfianza. Esos errores los recibe solo el dueño del proyecto por mail.
