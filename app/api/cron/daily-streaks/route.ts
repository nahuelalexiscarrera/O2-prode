/**
 * POST /api/cron/daily-streaks
 *
 * Evaluates consistency achievements (C01 streak_days_7, C02 streak_days_21,
 * C04 group_first_day) for all active users.
 *
 * Triggered daily at ~02:00 ART by Vercel Cron or an external scheduler.
 * Protected by Authorization: Bearer <CRON_SECRET>.
 */

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
  return auth === `Bearer ${secret}`;
}

async function handle(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all users with at least one prediction
  const { data: users, error: usersErr } = await supabase
    .from("user")
    .select("id, position, total_points")
    .is("deleted_at", null);

  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 });

  const results: { userId: string; unlocked: string[] }[] = [];

  for (const u of users ?? []) {
    const userId = u.id as string;

    // Count distinct prediction days in the last 21 days
    const cutoff21 = new Date(Date.now() - 21 * 86400 * 1000).toISOString();
    const cutoff7 = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

    const [preds21, preds7] = await Promise.all([
      supabase
        .from("prediction")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", cutoff21),
      supabase
        .from("prediction")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", cutoff7),
    ]);

    const daysWithPreds7 = new Set(
      (preds7.data ?? []).map((p) =>
        new Date(p.created_at as string).toLocaleDateString("en-CA")
      )
    ).size;

    const daysWithPreds21 = new Set(
      (preds21.data ?? []).map((p) =>
        new Date(p.created_at as string).toLocaleDateString("en-CA")
      )
    ).size;

    // Get already-unlocked achievements
    const { data: unlocked } = await supabase
      .from("user_achievement")
      .select("achievement_id")
      .eq("user_id", userId);
    const alreadyUnlocked = new Set((unlocked ?? []).map((r) => r.achievement_id as string));

    const ctx: TriggerContext = {
      userId,
      exactStreak: 0,
      streakDays: Math.max(daysWithPreds7, daysWithPreds21),
      tournamentCompletionPercent: 0,
      loadedGroupFirstDay: false,
      groups: [],
      knockoutRounds: [],
      upsets: { upsetsCorrect: 0 },
      position: (u.position as number) ?? 0,
      weeklyPositionDelta: 0,
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

    const newAchievements = evaluateForEvent("daily-cron", ctx, alreadyUnlocked);
    if (newAchievements.length === 0) continue;

    // Persist unlocks
    const rows = newAchievements.map((r) => ({
      user_id: userId,
      achievement_id: r.achievement.id,
      unlocked_at: new Date().toISOString(),
      shared: false,
    }));
    await supabase.from("user_achievement").insert(rows);

    // Apply bonus points — desde la DB (editables por el admin)
    const totalBonus = await sumEffectivePoints(newAchievements.map((r) => r.achievement.id));
    if (totalBonus > 0) {
      await supabase.rpc("fn_add_points", { p_user_id: userId, p_delta: totalBonus });
    }

    // Create notifications
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

  return NextResponse.json({ ok: true, processed: users?.length ?? 0, results });
}

// Vercel Cron dispara GET; mantenemos POST para invocación manual.
export const GET = handle;
export const POST = handle;
