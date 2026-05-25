/**
 * O2 PRODE — Matches · Server Queries
 */

import { createClient } from "@/lib/supabase/server";

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
  const { data, error } = await supabase
    .from("match")
    .select(MATCH_FIELDS)
    .in("status", ["scheduled", "live"])
    .gte("kickoff_at", new Date().toISOString())
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
    .in("phase", ["round-of-16", "quarter", "semi", "final"])
    .order("kickoff_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
