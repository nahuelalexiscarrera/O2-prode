"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIsAdmin } from "@/lib/users/queries";
import {
  evaluateMatchSettledForUsers,
  revertMatchSettledAchievements,
} from "@/lib/achievements/match-settled";

const resultSchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
});

export type AdminActionResult = { ok: true } | { ok: false; error: string };

/**
 * Carga (o corrige) el resultado de un partido. Inserta match_result y marca el
 * partido como finished: el trigger trg_match_status_change dispara fn_settle_match
 * → puntúa todas las predicciones → recalcula el ranking. Si el partido YA estaba
 * finalizado (corrección), usa fn_resettle_match para revertir y re-puntuar.
 */
export async function setMatchResultAction(input: {
  matchId: string;
  homeScore: number;
  awayScore: number;
}): Promise<AdminActionResult> {
  const parsed = resultSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  if (!(await getIsAdmin())) return { ok: false, error: "No autorizado." };

  const { matchId, homeScore, awayScore } = parsed.data;
  const admin = createAdminClient();

  const { data: match, error: matchErr } = await admin
    .from("match")
    .select("status")
    .eq("id", matchId)
    .maybeSingle();
  if (matchErr || !match) return { ok: false, error: "Partido no encontrado." };

  const wasFinished = match.status === "finished";

  const { error: rErr } = await admin.from("match_result").upsert(
    {
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      finished_at: new Date().toISOString(),
    },
    { onConflict: "match_id" }
  );
  if (rErr) return { ok: false, error: "No se pudo guardar el resultado." };

  if (wasFinished) {
    // Corrección: revertir puntos viejos + re-puntuar.
    const { error } = await admin.rpc("fn_resettle_match", { p_match_id: matchId });
    if (error) {
      return {
        ok: false,
        error: "Resultado guardado, pero falta correr la migración fn_resettle_match para re-puntuar.",
      };
    }
  } else {
    // Primera vez: marcar finished dispara fn_settle_match vía trigger.
    const { error } = await admin.from("match").update({ status: "finished" }).eq("id", matchId);
    if (error) return { ok: false, error: "No se pudo cerrar el partido." };
  }

  // Logros match-settled de los socios que predijeron este partido. El cron
  // hace esto tras settle; en carga/corrección MANUAL hay que replicarlo (si no,
  // por esta vía los logros de skill/posición nunca se evaluaban). En una
  // corrección, primero revertimos los logros viejos (el bonus puede haber
  // quedado inflado con el resultado erróneo) y re-evaluamos limpio.
  try {
    const { data: preds } = await admin
      .from("prediction")
      .select("user_id")
      .eq("match_id", matchId);
    const affected = [...new Set((preds ?? []).map((p: { user_id: string }) => p.user_id))];
    if (affected.length > 0) {
      if (wasFinished) await revertMatchSettledAchievements(affected);
      await evaluateMatchSettledForUsers(affected);
    }
  } catch (e) {
    console.error("[admin setMatchResult] eval de logros falló", e);
  }

  await admin.rpc("fn_refresh_views");
  revalidatePath("/app/admin/partidos");
  revalidatePath("/app/ranking");
  revalidatePath("/app/prode");
  revalidatePath("/app");
  return { ok: true };
}

/** Edita los puntos bonus de un logro (achievement_catalog). El awarding usa
 *  este valor, así que el admin controla cuánto suma cada logro. */
export async function setAchievementPointsAction(input: {
  id: string;
  pointsBonus: number;
}): Promise<AdminActionResult> {
  const schema = z.object({
    id: z.string().min(2).max(8),
    pointsBonus: z.number().int().min(0).max(500),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  if (!(await getIsAdmin())) return { ok: false, error: "No autorizado." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("achievement_catalog")
    .update({ points_bonus: parsed.data.pointsBonus })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: "No se pudo guardar los puntos." };

  revalidatePath("/app/admin/logros");
  return { ok: true };
}

/** Cambia el status de un partido (live / scheduled / postponed) sin cargar resultado. */
export async function setMatchStatusAction(input: {
  matchId: string;
  status: "scheduled" | "live" | "postponed";
}): Promise<AdminActionResult> {
  const schema = z.object({
    matchId: z.string().uuid(),
    status: z.enum(["scheduled", "live", "postponed"]),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  if (!(await getIsAdmin())) return { ok: false, error: "No autorizado." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("match")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.matchId);
  if (error) return { ok: false, error: "No se pudo actualizar el partido." };

  revalidatePath("/app/admin/partidos");
  revalidatePath("/app/prode");
  return { ok: true };
}
