"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIsAdmin } from "@/lib/users/queries";
import { sendSupportEmail, isEmailConfigured } from "@/lib/email/send";

const ticketSchema = z.object({
  title: z.string().trim().min(3, "Mínimo 3 caracteres").max(200),
  description: z.string().trim().min(5, "Contá un poco más el problema").max(5000),
  severity: z.enum(["baja", "media", "alta", "critica"]),
  area: z.string().trim().max(120).optional().or(z.literal("")),
});

export type CreateTicketResult =
  | { ok: true; ticketNumber: string; sent: boolean }
  | { ok: false; error: string };

/**
 * Crea un ticket de soporte (solo admin). Guarda el ticket local con su número y
 * lo manda por email al dueño del proyecto. Si el email no está configurado o
 * falla, el ticket queda guardado igual. El admin NO ve a dónde se enruta.
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

  if (!isEmailConfigured()) {
    return { ok: true, ticketNumber, sent: false };
  }

  // Nombre del reportante para el cuerpo del mail.
  let reporterName: string | null = null;
  if (user?.id) {
    const { data: u } = await admin.from("user").select("name").eq("id", user.id).maybeSingle();
    reporterName = (u?.name as string | null) ?? null;
  }

  const mail = await sendSupportEmail({
    subject: `[O2 PRODE] ${ticketNumber} · ${parsed.data.severity.toUpperCase()} · ${parsed.data.title}`,
    lines: [
      `Ticket: ${ticketNumber}`,
      `Severidad: ${parsed.data.severity}`,
      parsed.data.area ? `Área: ${parsed.data.area}` : "Área: —",
      `Reportó: ${reporterName ?? user?.email ?? "—"}`,
      "",
      `Título: ${parsed.data.title}`,
      "",
      "Detalle:",
      parsed.data.description,
    ],
  });

  // status 'enviado' si el mail salió; 'error_jira' se reusa como "no enviado".
  await admin
    .from("support_ticket")
    .update({ status: mail.ok ? "enviado" : "error_jira" })
    .eq("id", ticket.id);
  revalidatePath("/app/admin/soporte");

  return { ok: true, ticketNumber, sent: mail.ok };
}
