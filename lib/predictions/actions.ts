"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PREDICTION_LOCKOUT_MS } from "@/lib/predictions/lockout";

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

  // Solo se predice un partido programado y antes del cierre (20 min antes del
  // kickoff; ver lib/predictions/lockout.ts). Si ya está en juego (live),
  // terminado o postergado, está cerrado. (Antes el `&& status !== "live"`
  // dejaba editar partidos EN JUEGO — bug de integridad: se podía "predecir"
  // viendo el partido.)
  const lockoutAt = new Date(match.kickoff_at).getTime() - PREDICTION_LOCKOUT_MS;
  const isOpen = match.status === "scheduled" && Date.now() < lockoutAt;
  if (!isOpen) {
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

// ─── Predicción especial (campeón / subcampeón / mejor de grupos / revelación) ──

const SpecialSchema = z.object({
  championCode: z.string().trim().min(2),
  runnerUpCode: z.string().trim().min(2),
  groupStageBestCode: z.string().trim().min(2),
  revelationCode: z.string().trim().min(2),
});

export async function upsertSpecialPrediction(input: unknown) {
  const parsed = SpecialSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" as const };

  // Estado imposible: el campeón y el subcampeón juegan la final entre sí, no
  // pueden ser el mismo equipo (B2). Esto también bloquea el caso degenerado de
  // elegir el mismo equipo en todos los slots.
  if (parsed.data.championCode.trim().toLowerCase() === parsed.data.runnerUpCode.trim().toLowerCase()) {
    return { error: "El campeón y el subcampeón no pueden ser el mismo equipo." as const };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" as const };

  // Cierre: la predicción especial se bloquea cuando arranca el torneo (1er partido).
  const { data: firstMatch } = await supabase
    .from("match")
    .select("kickoff_at")
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstMatch && Date.now() >= new Date(firstMatch.kickoff_at).getTime()) {
    return { error: "El torneo ya arrancó: la predicción especial está cerrada." as const };
  }

  const { data: tournament } = await supabase
    .from("tournament")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!tournament) return { error: "Torneo no encontrado" as const };

  const { error } = await supabase.from("special_prediction").upsert(
    {
      user_id: user.id,
      tournament_id: tournament.id as string,
      champion_code: parsed.data.championCode,
      runner_up_code: parsed.data.runnerUpCode,
      group_stage_best_code: parsed.data.groupStageBestCode,
      revelation_code: parsed.data.revelationCode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: "No se pudo guardar la predicción especial." as const };
  return { success: true };
}
