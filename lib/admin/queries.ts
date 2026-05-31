/**
 * O2 PRODE — Métricas de admin.
 *
 * Conteos agregados de toda la base. Usa el cliente service-role para obtener
 * totales reales (no limitados por RLS). SOLO llamar desde una página ya
 * verificada como admin (getIsAdmin()).
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type AdminMetrics = {
  socios: number;
  sociosNuevos7d: number;
  predicciones: number;
  predicciones24h: number;
  posts: number;
  comentarios: number;
  reacciones: number;
  partidos: number;
  partidosFinalizados: number;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const admin = createAdminClient();
  const d7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const h24 = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const head = { count: "exact" as const, head: true };

  const [
    socios,
    sociosNuevos7d,
    predicciones,
    predicciones24h,
    posts,
    comentarios,
    reacciones,
    partidos,
    partidosFinalizados,
  ] = await Promise.all([
    admin.from("user").select("*", head).is("deleted_at", null),
    admin.from("user").select("*", head).is("deleted_at", null).gte("joined_at", d7),
    admin.from("prediction").select("*", head),
    admin.from("prediction").select("*", head).gte("updated_at", h24),
    admin.from("post").select("*", head).is("deleted_at", null),
    admin.from("comment").select("*", head).is("deleted_at", null),
    admin.from("reaction").select("*", head),
    admin.from("match").select("*", head),
    admin.from("match").select("*", head).eq("status", "finished"),
  ]);

  return {
    socios: socios.count ?? 0,
    sociosNuevos7d: sociosNuevos7d.count ?? 0,
    predicciones: predicciones.count ?? 0,
    predicciones24h: predicciones24h.count ?? 0,
    posts: posts.count ?? 0,
    comentarios: comentarios.count ?? 0,
    reacciones: reacciones.count ?? 0,
    partidos: partidos.count ?? 0,
    partidosFinalizados: partidosFinalizados.count ?? 0,
  };
}
