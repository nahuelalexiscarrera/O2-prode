/**
 * POST /api/cron/weekly-positions
 *
 * Evaluates position-based weekly achievement (P04 weekly_rise_10).
 * Triggered every Monday at ~03:00 ART.
 * Protected by Authorization: Bearer <CRON_SECRET>.
 *
 * Requires a `user_position_snapshot` table or weekly snapshot mechanism.
 * Until that table exists, computes delta from a "position_last_week" column
 * if available, falling back to 0 (no-op for new users).
 */

import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateForEvent } from "@/lib/achievements/triggers";
import type { TriggerContext } from "@/lib/achievements/triggers";
import { pushToUser } from "@/lib/push/notify";
import { sumEffectivePoints } from "@/lib/achievements/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authOk(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  // AUTH-009: comparación en tiempo constante para prevenir timing attacks.
  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function handle(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // En plan Hobby de Vercel los crons solo corren 1×/día. Este cron está
  // calendarizado diario pero la lógica de "weekly position" solo tiene
  // sentido los lunes (UTC), comparando contra el snapshot de la semana
  // anterior. Los demás días retornamos 200 sin tocar nada.
  const todayUTC = new Date().getUTCDay(); // 0 = domingo, 1 = lunes
  if (todayUTC !== 1) {
    return NextResponse.json({ ok: true, skipped: "weekly-positions solo corre los lunes (UTC)" });
  }

  const supabase = createAdminClient();

  const { data: users, error: usersErr } = await supabase
    .from("user")
    .select("id, position, position_last_week")
    .is("deleted_at", null);

  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 });

  const userList = users ?? [];

  // CRON-005: tomar el snapshot de posiciones ANTES de evaluar logros.
  // Si lo tomamos al final del loop (como antes), los bonus de puntos que
  // otorgamos durante la evaluación pueden correr fn_recalculate_positions y
  // modificar las posiciones en DB. El snapshot quedaría con posiciones
  // post-bonus, no las del inicio de semana → el delta de la PRÓXIMA semana
  // sería incorrecto. Al snapshottear primero, position_last_week refleja
  // la posición de entrada a la semana, independientemente de los bonuses.
  const snapshotRows = userList.map((u) => ({
    id: u.id as string,
    position_last_week: (u.position as number) ?? 0,
  }));
  // Batch update de todos los snapshots antes de cualquier modificación.
  for (let i = 0; i < snapshotRows.length; i += 100) {
    const batch = snapshotRows.slice(i, i + 100);
    await Promise.all(
      batch.map((r) =>
        supabase.from("user").update({ position_last_week: r.position_last_week }).eq("id", r.id)
      )
    );
  }

  // SEGUNDA PASADA: evaluación de logros con las posiciones ya consistentes.
  const results: { userId: string; unlocked: string[] }[] = [];

  for (const u of userList) {
    const userId = u.id as string;
    const position = (u.position as number) ?? 0;
    const positionLastWeek = (u.position_last_week as number | null) ?? position;
    const weeklyPositionDelta = positionLastWeek - position; // positive = subió

    const { data: unlocked } = await supabase
      .from("user_achievement")
      .select("achievement_id")
      .eq("user_id", userId);
    const alreadyUnlocked = new Set((unlocked ?? []).map((r) => r.achievement_id as string));

    const ctx: TriggerContext = {
      userId,
      exactStreak: 0,
      streakDays: 0,
      tournamentCompletionPercent: 0,
      loadedGroupFirstDay: false,
      groups: [],
      knockoutRounds: [],
      upsets: { upsetsCorrect: 0 },
      position,
      weeklyPositionDelta,
      postsCount: 0,
      bestPostReactions: 0,
      commentsMadeOnDistinctPostsCount: 0,
      externalSharesCount: 0,
      activatedFriendsCount: 0,
      predictedChampionCode: null,
      actualChampionCode: null,
      tournamentEnded: false,
      tournamentWinnerUserId: null,
    };

    const newAchievements = evaluateForEvent("weekly-cron", ctx, alreadyUnlocked);
    if (newAchievements.length > 0) {
      const rows = newAchievements.map((r) => ({
        user_id: userId,
        achievement_id: r.achievement.id,
        unlocked_at: new Date().toISOString(),
        shared: false,
      }));
      await supabase.from("user_achievement").insert(rows);

      const totalBonus = await sumEffectivePoints(newAchievements.map((r) => r.achievement.id));
      if (totalBonus > 0) {
        await supabase.rpc("fn_add_points", { p_user_id: userId, p_delta: totalBonus });
      }

      const notifs = newAchievements.map((r) => ({
        user_id: userId,
        type: "achievement-unlocked" as const,
        title: "Logro desbloqueado",
        body: `${r.achievement.name} · ${r.achievement.description}`,
        deep_link: `/perfil/logros#${r.achievement.id}`,
      }));
      await supabase.from("notification").insert(notifs);
      await pushToUser(userId, {
        title: "Logro desbloqueado",
        body:
          newAchievements.length === 1
            ? (newAchievements[0]?.achievement.name ?? "Nuevo logro")
            : `Desbloqueaste ${newAchievements.length} logros nuevos`,
        deep_link: "/app/perfil/logros",
      });

      results.push({ userId, unlocked: newAchievements.map((r) => r.achievement.id) });
    }
  }

  return NextResponse.json({ ok: true, processed: userList.length, results });
}

// Vercel Cron dispara GET; mantenemos POST para invocación manual.
export const GET = handle;
export const POST = handle;
