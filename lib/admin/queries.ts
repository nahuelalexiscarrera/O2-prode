/**
 * O2 PRODE — Métricas de admin.
 *
 * Conteos agregados de toda la base. Usa el cliente service-role para obtener
 * totales reales (no limitados por RLS). SOLO llamar desde una página ya
 * verificada como admin (getIsAdmin()).
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type AdminMatch = {
  id: string;
  homeCode: string;
  awayCode: string;
  homeName: string;
  awayName: string;
  kickoffAt: string;
  status: "scheduled" | "live" | "finished" | "postponed";
  phase: string;
  homeScore: number | null;
  awayScore: number | null;
};

/** Lista todos los partidos con su resultado (si lo tienen) y nombres de equipo. */
export async function getMatchesForAdmin(): Promise<AdminMatch[]> {
  const admin = createAdminClient();
  const [matchesRes, teamsRes, resultsRes] = await Promise.all([
    admin
      .from("match")
      .select("id, home_code, away_code, kickoff_at, status, phase")
      .order("kickoff_at", { ascending: true }),
    admin.from("team").select("code, name"),
    admin.from("match_result").select("match_id, home_score, away_score"),
  ]);

  const nameByCode = new Map((teamsRes.data ?? []).map((t) => [t.code as string, t.name as string]));
  const resByMatch = new Map(
    (resultsRes.data ?? []).map((r) => [r.match_id as string, r])
  );

  return (matchesRes.data ?? []).map((m) => {
    const r = resByMatch.get(m.id as string);
    return {
      id: m.id as string,
      homeCode: m.home_code as string,
      awayCode: m.away_code as string,
      homeName: nameByCode.get(m.home_code as string) ?? (m.home_code as string),
      awayName: nameByCode.get(m.away_code as string) ?? (m.away_code as string),
      kickoffAt: m.kickoff_at as string,
      status: m.status as AdminMatch["status"],
      phase: m.phase as string,
      homeScore: (r?.home_score as number | undefined) ?? null,
      awayScore: (r?.away_score as number | undefined) ?? null,
    };
  });
}

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
