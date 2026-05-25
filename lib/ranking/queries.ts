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
  computedPosition: number;
};

export async function getGlobalRanking(limit = 100): Promise<RankingUserRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user")
    .select("id, name, initials, avatar_url, level, total_points, joined_at")
    .is("deleted_at", null)
    .order("total_points", { ascending: false })
    .order("joined_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((u, i) => ({ ...u, computedPosition: i + 1 })) as RankingUserRow[];
}
