/**
 * O2 PRODE — Matches · Server Queries
 */

import { createClient } from "@/lib/supabase/server";
import type { Phase } from "@/types/domain";

const MATCH_FIELDS = `
  id, phase, group_id, home_code, away_code,
  kickoff_at, venue_city, status,
  home_team:team!home_code ( code, name ),
  away_team:team!away_code ( code, name ),
  result:match_result ( home_score, away_score, finished_at )
` as const;

export async function getMatchesByGroup(groupId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match")
    .select(MATCH_FIELDS)
    .eq("group_id", groupId.toUpperCase())
    .order("kickoff_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type MatchWithTeams = Awaited<ReturnType<typeof getMatchesByGroup>>[number];

export async function getNextMatch() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Primero: partido en vivo (su kickoff_at ya pasó, no filtramos por fecha)
  const { data: live, error: liveErr } = await supabase
    .from("match")
    .select(MATCH_FIELDS)
    .eq("status", "live")
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (liveErr) throw liveErr;
  if (live) return live;

  // Segundo: próximo partido scheduled
  const { data, error } = await supabase
    .from("match")
    .select(MATCH_FIELDS)
    .eq("status", "scheduled")
    .gte("kickoff_at", now)
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type NextMatchRow = Awaited<ReturnType<typeof getNextMatch>>;

export async function getKnockoutMatches() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match")
    .select(MATCH_FIELDS)
    .in("phase", ["round-of-32", "round-of-16", "quarter", "semi", "final"])
    .order("kickoff_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Devuelve la fase actual del torneo activo.
 * Usa el partido más avanzado (live o finished). Fallback: "groups".
 */
export async function getCurrentPhase(): Promise<Phase> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("match")
    .select("phase")
    .in("status", ["live", "finished"])
    .order("kickoff_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data?.phase) return data.phase as Phase;
  return "groups";
}
