"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const UpsertSchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
});

export async function upsertPrediction(input: unknown) {
  const parsed = UpsertSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" as const };

  const { matchId, homeScore, awayScore } = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" as const };

  const { data: match, error: matchErr } = await supabase
    .from("match")
    .select("kickoff_at, status")
    .eq("id", matchId)
    .single();
  if (matchErr || !match) return { error: "Partido no encontrado" as const };

  const lockoutAt = new Date(match.kickoff_at).getTime() - 60 * 60 * 1000;
  if (Date.now() >= lockoutAt && match.status !== "live") {
    return { error: "El partido ya está cerrado" as const };
  }

  const { error } = await supabase.from("prediction").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) return { error: "Error al guardar" as const };
  return { success: true };
}
