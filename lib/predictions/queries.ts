/**
 * O2 PRODE — Predictions · Server Queries
 */

import { createClient } from "@/lib/supabase/server";

export type PredictionRow = {
  id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points_earned: number | null;
};

export async function getMyPredictionCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("prediction")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) return 0;
  return count ?? 0;
}

export async function getMyPredictionsForMatches(
  userId: string,
  matchIds: string[]
): Promise<Record<string, PredictionRow>> {
  if (matchIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prediction")
    .select("id, match_id, home_score, away_score, points_earned")
    .eq("user_id", userId)
    .in("match_id", matchIds);
  if (error) throw error;
  const map: Record<string, PredictionRow> = {};
  for (const p of data ?? []) {
    map[p.match_id] = p as PredictionRow;
  }
  return map;
}
