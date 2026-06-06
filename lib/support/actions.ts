"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIsAdmin } from "@/lib/users/queries";
import { createJiraIssue, isJiraConfigured } from "@/lib/jira/client";

const ticketSchema = z.object({
  title: z.string().trim().min(3, "Mínimo 3 caracteres").max(200),
  description: z.string().trim().min(5, "Contá un poco más el problema").max(5000),
  severity: z.enum(["baja", "media", "alta", "critica"]),
  area: z.string().trim().max(120).optional().or(z.literal("")),
});

export type CreateTicketResult =
  | {
      ok: true;
      ticketNumber: string;
      jiraConfigured: boolean;
      jiraUrl: string | null;
      jiraError?: string;
    }
  | { ok: false; error: string };

/**
 * Crea un ticket de soporte (solo admin). Guarda el ticket local con su número
 * y, si Jira está configurado, crea el issue espejo. Si Jira falla o no está
 * configurado, el ticket queda guardado igual (status abierto / error_jira).
 */
export async function createSupportTicketAction(input: unknown): Promise<CreateTicketResult> {
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  if (!(await getIsAdmin())) return { ok: false, error: "No autorizado" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: ticket, error } = await admin
    .from("support_ticket")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      severity: parsed.data.severity,
      area: parsed.data.area || null,
      reporter_id: user?.id ?? null,
    })
    .select("id, ticket_number")
    .single();

  if (error || !ticket) return { ok: false, error: "No se pudo crear el ticket." };

  const ticketNumber = ticket.ticket_number as string;

  if (!isJiraConfigured()) {
    return { ok: true, ticketNumber, jiraConfigured: false, jiraUrl: null };
  }

  // Nombre del reportante para el cuerpo del issue.
  let reporterName: string | null = null;
  if (user?.id) {
    const { data: u } = await admin.from("user").select("name").eq("id", user.id).maybeSingle();
    reporterName = (u?.name as string | null) ?? null;
  }

  const jira = await createJiraIssue({
    summary: `[${parsed.data.severity.toUpperCase()}] ${parsed.data.title}`,
    description: parsed.data.description,
    severity: parsed.data.severity,
    area: parsed.data.area || null,
    ticketNumber,
    reporter: reporterName,
  });

  if (jira.ok) {
    await admin
      .from("support_ticket")
      .update({ status: "enviado", jira_issue_key: jira.key, jira_url: jira.url })
      .eq("id", ticket.id);
    revalidatePath("/app/admin/soporte");
    return { ok: true, ticketNumber, jiraConfigured: true, jiraUrl: jira.url };
  }

  await admin.from("support_ticket").update({ status: "error_jira" }).eq("id", ticket.id);
  revalidatePath("/app/admin/soporte");
  return { ok: true, ticketNumber, jiraConfigured: true, jiraUrl: null, jiraError: jira.error };
}
