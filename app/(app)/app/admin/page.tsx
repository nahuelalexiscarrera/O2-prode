import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/users/queries";
import { getAdminMetrics } from "@/lib/admin/queries";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { NavRow } from "@/components/features/NavRow";

export const dynamic = "force-dynamic";

function Metric({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </span>
      <span className="font-display text-numeric-lg text-text tabular leading-none">{value}</span>
      {sub ? <span className="text-[11px] text-text-disabled">{sub}</span> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-4 pb-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-3">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  if (!(await getIsAdmin())) notFound();

  const m = await getAdminMetrics();

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col">
      <ScreenHeader title="Panel de admin" backHref="/app/perfil" />

      <p className="px-4 pt-2 pb-5 text-body-sm text-text-muted">
        Resumen en vivo de la actividad del prode.
      </p>

      <div className="mx-4 mb-6 bg-card rounded-xl border border-border overflow-hidden">
        <NavRow href="/app/admin/partidos" label="Cargar resultados de partidos" />
        <NavRow href="/app/admin/logros" label="Puntos de logros" />
      </div>

      <Section title="Comunidad">
        <Metric label="Socios" value={m.socios} sub="cuentas confirmadas" />
        <Metric label="Nuevos" value={m.sociosNuevos7d} sub="últimos 7 días" />
      </Section>

      <Section title="Juego">
        <Metric label="Predicciones" value={m.predicciones} sub="cargadas en total" />
        <Metric label="Últimas 24 h" value={m.predicciones24h} sub="predicciones" />
        <Metric
          label="Partidos"
          value={`${m.partidosFinalizados}/${m.partidos}`}
          sub="finalizados / total"
        />
      </Section>

      <Section title="Muro">
        <Metric label="Posts" value={m.posts} />
        <Metric label="Comentarios" value={m.comentarios} />
        <Metric label="Reacciones" value={m.reacciones} />
      </Section>
    </div>
  );
}
