/**
 * O2 PRODE — Share Data Fetchers (edge-compatible)
 * Fetches only what each template needs, using the admin client.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { ACHIEVEMENT_BY_ID } from "@/lib/achievements/catalog";
import { getLevelMeta } from "@/lib/achievements/levels";
import type {
  ShareData,
  ShareTemplateId,
  SummaryShareData,
  PositionShareData,
  MatchShareData,
  AchievementShareData,
} from "./templates";
import type { UserLevel } from "@/types/domain";

const PHASE_LABELS: Record<string, string> = {
  groups: "Fase de Grupos",
  "round-of-16": "Octavos de Final",
  quarter: "Cuartos de Final",
  semi: "Semifinales",
  final: "Final",
};

async function fetchUserCore(userId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("user")
    .select("name, initials, level, total_points, position")
    .eq("id", userId)
    .single();
  if (!data) return null;
  const level = Number(data.level ?? 1) as UserLevel;
  return {
    userId,
    userName: data.name as string,
    userInitials: data.initials as string,
    userLevel: level,
    userLevelName: getLevelMeta(level).name,
    totalPoints: data.total_points as number,
    position: data.position as number,
  };
}

export async function fetchShareData(
  template: ShareTemplateId,
  userId: string,
  contextId?: string
): Promise<ShareData | null> {
  const user = await fetchUserCore(userId);
  if (!user) return null;

  const supabase = createAdminClient();

  if (template === "summary") {
    // Fetch special prediction if available
    const { data: special } = await supabase
      .from("special_prediction")
      .select("champion_code, top_scorer_player_id")
      .eq("user_id", userId)
      .maybeSingle();

    // OJO: la columna es champion_code (no champion_team_code). Y sin predicción
    // especial cargada NO defaulteamos a Argentina (era el bug: todos campeón ARG).
    const championCode = (special?.champion_code as string | null) ?? null;
    const isArg = championCode?.toLowerCase() === "arg";

    const summaryData: SummaryShareData = {
      template: "summary",
      userId: user.userId,
      userName: user.userName,
      userInitials: user.userInitials,
      userLevel: user.userLevel,
      userLevelName: user.userLevelName,
      champion: {
        country: (championCode ?? "—").toUpperCase(),
        flagCode: (championCode ?? "ar").toLowerCase(),
      },
      topScorer: { name: "—", country: "—", flagCode: "ar" },
      finalResult: {
        home: { country: "—", flagCode: "ar" },
        away: { country: "—", flagCode: "ar" },
        score: [0, 0],
      },
      points: user.totalPoints,
      position: user.position,
      isArgentinaChampion: isArg ?? false,
    };
    return summaryData;
  }

  if (template === "position") {
    const { count: totalSocios } = await supabase
      .from("user")
      .select("*", { count: "exact", head: true });

    const positionData: PositionShareData = {
      template: "position",
      userId: user.userId,
      userName: user.userName,
      userInitials: user.userInitials,
      userLevel: user.userLevel,
      userLevelName: user.userLevelName,
      position: user.position > 0 ? user.position : 1,
      points: user.totalPoints,
      totalSocios: totalSocios ?? 800,
      deltaPosition: 0,
      weekPoints: 0,
      weekNumber: 1,
    };
    return positionData;
  }

  if (template === "match" && contextId) {
    type TeamRow = { code: string; name: string };
    const { data: match } = await supabase
      .from("match")
      .select(
        "id, phase, group_id, home_code, away_code, kickoff_at, home_team:team!home_code(code,name), away_team:team!away_code(code,name)"
      )
      .eq("id", contextId)
      .single();

    const { data: prediction } = await supabase
      .from("prediction")
      .select("home_score, away_score")
      .match({ user_id: userId, match_id: contextId })
      .maybeSingle();

    if (!match) return null;

    const homeTeam = (match.home_team as unknown as TeamRow | null);
    const awayTeam = (match.away_team as unknown as TeamRow | null);
    const phaseKey = match.phase as string;
    const groupLabel = match.group_id ? `Grupo ${match.group_id}` : null;

    const matchData: MatchShareData = {
      template: "match",
      userId: user.userId,
      userName: user.userName,
      userInitials: user.userInitials,
      userLevel: user.userLevel,
      userLevelName: user.userLevelName,
      tournament: "Mundial 2026",
      phase: groupLabel ?? PHASE_LABELS[phaseKey] ?? phaseKey,
      home: {
        country: homeTeam?.name ?? (match.home_code as string).toUpperCase(),
        flagCode: (match.home_code as string).toLowerCase(),
      },
      away: {
        country: awayTeam?.name ?? (match.away_code as string).toUpperCase(),
        flagCode: (match.away_code as string).toLowerCase(),
      },
      predictedScore: [
        (prediction?.home_score as number | null) ?? 0,
        (prediction?.away_score as number | null) ?? 0,
      ],
      kickoffISO: match.kickoff_at as string,
      userPosition: user.position,
    };
    return matchData;
  }

  if (template === "achievement" && contextId) {
    const achDef = ACHIEVEMENT_BY_ID.get(contextId);
    if (!achDef) return null;

    const { data: userAch } = await supabase
      .from("user_achievement")
      .select("unlocked_at")
      .match({ user_id: userId, achievement_id: contextId })
      .maybeSingle();

    const catLabels: Record<string, string> = {
      skill: "Skill",
      consistency: "Constancia",
      social: "Social",
      position: "Posición",
    };

    const achData: AchievementShareData = {
      template: "achievement",
      userId: user.userId,
      userName: user.userName,
      userInitials: user.userInitials,
      userLevel: user.userLevel,
      userLevelName: user.userLevelName,
      achievementId: achDef.id,
      achievementName: achDef.name.toUpperCase(),
      achievementCategory: achDef.category,
      achievementDescription: achDef.description,
      iconRef: achDef.iconRef,
      unlockedAt: (userAch?.unlocked_at as string | null) ?? new Date().toISOString(),
    };
    return achData;
  }

  return null;
}
