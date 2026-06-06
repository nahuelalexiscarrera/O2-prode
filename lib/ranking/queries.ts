/**
 * O2 PRODE — Ranking · Server Queries
 */

import { createClient } from "@/lib/supabase/server";

export type RankingUserRow = {
  id: string;
  name: string;
  initials: string;
  avatar_url: string | null;
  level: string;
  total_points: number;
  joined_at: string;
  position_last_week: number | null;
  computedPosition: number;
};

export async function getGlobalRanking(limit = 100): Promise<RankingUserRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user")
    .select("id, name, initials, avatar_url, level, total_points, joined_at, position_last_week")
    .is("deleted_at", null)
    .order("total_points", { ascending: false })
    .order("joined_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((u, i) => ({ ...u, computedPosition: i + 1 })) as RankingUserRow[];
}

/**
 * Posición global del socio sin cargar las 800 filas ni usar OFFSET.
 * La posición se deriva con dos COUNT (head) que replican el mismo tie-break
 * del ranking: total_points DESC, y a igualdad de puntos gana el que se sumó
 * antes (joined_at ASC). Sirve para mostrar "mi posición" cuando el socio
 * está fuera del top-100 listado.
 */
export async function getMyRankEntry(userId: string): Promise<RankingUserRow | null> {
  const supabase = await createClient();

  const { data: me, error: meErr } = await supabase
    .from("user")
    .select("id, name, initials, avatar_url, level, total_points, joined_at, position_last_week")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (meErr || !me) return null;

  // Socios estrictamente por delante: más puntos…
  const { count: ahead } = await supabase
    .from("user")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gt("total_points", me.total_points);

  // …o mismos puntos pero se sumaron antes.
  const { count: tied } = await supabase
    .from("user")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("total_points", me.total_points)
    .lt("joined_at", me.joined_at);

  const computedPosition = (ahead ?? 0) + (tied ?? 0) + 1;
  return { ...me, computedPosition } as RankingUserRow;
}
