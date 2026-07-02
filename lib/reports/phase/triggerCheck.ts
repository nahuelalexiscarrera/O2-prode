/**
 * O2 PRODE — Disparo del reporte al cerrar una fase (brief §3 triggerCheck).
 *
 * Lo llama el cron sync-results tras cerrar partidos. Chequea, por cada fase
 * de los matches recién cerrados, si ya no quedan partidos pendientes en esa
 * fase. Si la fase cerró y no se reportó todavía, dispara el endpoint.
 *
 * Defensivo por diseño: cualquier fallo se traga acá — NUNCA debe romper el
 * settle del cron. El gate real de idempotencia es phase_report_log (UNIQUE).
 */

import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export async function maybeTriggerPhaseReport(
  admin: Admin,
  finishedMatchIds: string[]
): Promise<void> {
  try {
    if (finishedMatchIds.length === 0) return;

    const { data: fm } = await admin.from("match").select("phase").in("id", finishedMatchIds);
    const phases = [...new Set((fm ?? []).map((r) => r.phase as string))];
    if (phases.length === 0) return;

    const base = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    if (!base) {
      console.error("[phase-report] APP_URL ausente — no se puede disparar el reporte");
      return;
    }

    const { data: t } = await admin.from("tournament").select("id").eq("active", true).single();
    if (!t) return;

    for (const phase of phases) {
      // ¿Quedan partidos sin cerrar en esta fase?
      const { count } = await admin
        .from("match")
        .select("id", { count: "exact", head: true })
        .eq("phase", phase)
        .neq("status", "finished");
      if ((count ?? 0) > 0) continue;

      // ¿Ya se reportó esta fase?
      const { data: existing } = await admin
        .from("phase_report_log")
        .select("id")
        .eq("tournament_id", t.id)
        .eq("phase", phase)
        .maybeSingle();
      if (existing) continue;

      // Disparo fire-and-forget (el endpoint es idempotente vía el UNIQUE del log).
      try {
        await fetch(`${base}/api/admin/phase-report`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phase }),
        });
      } catch (e) {
        console.error("[phase-report] disparo falló para", phase, (e as Error).message);
      }
    }
  } catch (e) {
    console.error("[phase-report] triggerCheck error:", (e as Error).message);
  }
}
