import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/users/queries";
import { getSupportTickets } from "@/lib/support/queries";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { SupportTicketForm } from "@/components/features/SupportTicketForm";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

const SEV_LABEL: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};
const STATUS_LABEL: Record<string, string> = {
  abierto: "Pendiente",
  enviado: "Enviado",
  error_jira: "Pendiente",
};

export default async function SoportePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  if (!(await getIsAdmin())) notFound();

  const tickets = await getSupportTickets();

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col gap-5">
      <ScreenHeader title="Soporte" backHref="/app/admin" />

      <p className="px-4 text-body-sm text-text-muted">
        Reportá un problema o una consulta. Cada ticket recibe un número de seguimiento.
      </p>

      <SupportTicketForm />

      <div className="px-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-3">
          Tickets recientes
        </h2>

        {tickets.length === 0 ? (
          <p className="text-body-sm text-text-muted">Todavía no hay tickets.</p>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border last:border-b-0"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-body-sm text-text font-medium truncate">{t.title}</span>
                  <span className="text-[11px] text-text-muted">
                    {t.ticket_number} · {SEV_LABEL[t.severity] ?? t.severity}
                    {t.area ? ` · ${t.area}` : ""}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wide shrink-0",
                    t.status === "enviado" ? "text-success" : "text-text-muted"
                  )}
                >
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
