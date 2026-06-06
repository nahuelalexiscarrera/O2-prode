/**
 * O2 PRODE — Achievement Catalog
 * Agente 11 · Gamification
 *
 * Source of truth for the 19 achievements available in MVP.
 * Mirror lives in data/mocks/achievements.json for seeding.
 */

import type { AchievementCategory } from "@/types/domain";

export type AchievementImpact = "high" | "medium" | "low";

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  iconRef: string;
  pointsBonus: number;
  triggerKey: string;
  impact: AchievementImpact;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // ─── Skill ─────────────────────────────────────────────────────────
  {
    id: "A01",
    category: "skill",
    name: "El que sabe",
    description: "Acertá 5 resultados exactos seguidos.",
    iconRef: "target",
    pointsBonus: 15,
    triggerKey: "streak_exact_5",
    impact: "medium",
  },
  {
    id: "A02",
    category: "skill",
    name: "Visionario",
    description: "Acertá al campeón del Mundial antes del torneo.",
    iconRef: "crown",
    pointsBonus: 40,
    triggerKey: "champion_correct",
    impact: "high",
  },
  {
    id: "A03",
    category: "skill",
    name: "Mufa controlada",
    description: "Acertá un upset: predijiste al no-favorito y ganó.",
    iconRef: "flame",
    pointsBonus: 10,
    triggerKey: "upset_correct",
    impact: "medium",
  },
  {
    id: "A04",
    category: "skill",
    name: "Pleno",
    description: "Acertá TODOS los partidos de un grupo.",
    iconRef: "check",
    pointsBonus: 20,
    triggerKey: "group_complete_correct",
    impact: "medium",
  },
  {
    id: "A05",
    category: "skill",
    name: "Eliminator",
    description: "Acertá todos los cruces de octavos.",
    iconRef: "medal",
    pointsBonus: 25,
    triggerKey: "knockout_round_correct",
    impact: "high",
  },
  {
    id: "A06",
    category: "skill",
    name: "Subcampeón",
    description: "Acertá al subcampeón del Mundial antes del torneo.",
    iconRef: "medal",
    pointsBonus: 30,
    triggerKey: "runner_up_correct",
    impact: "high",
  },
  {
    id: "A07",
    category: "skill",
    name: "Finalistas",
    description: "Acertá a los 2 finalistas del Mundial.",
    iconRef: "world-trophy",
    pointsBonus: 40,
    triggerKey: "finalists_correct",
    impact: "high",
  },

  // ─── Consistency ───────────────────────────────────────────────────
  {
    id: "C01",
    category: "consistency",
    name: "Constante",
    description: "7 días seguidos cargando predicciones.",
    iconRef: "flame",
    pointsBonus: 10,
    triggerKey: "streak_days_7",
    impact: "low",
  },
  {
    id: "C02",
    category: "consistency",
    name: "Maratonista",
    description: "21 días seguidos cargando predicciones.",
    iconRef: "flame",
    pointsBonus: 30,
    triggerKey: "streak_days_21",
    impact: "medium",
  },
  {
    id: "C03",
    category: "consistency",
    name: "Todoterreno",
    description: "Cargaste el 100% de los partidos del torneo.",
    iconRef: "ball",
    pointsBonus: 50,
    triggerKey: "tournament_100",
    impact: "high",
  },
  {
    id: "C04",
    category: "consistency",
    name: "Madrugador",
    description: "Cargaste un grupo completo el 1er día disponible.",
    iconRef: "clock",
    pointsBonus: 5,
    triggerKey: "group_first_day",
    impact: "low",
  },

  // ─── Social ────────────────────────────────────────────────────────
  {
    id: "S01",
    category: "social",
    name: "Inicio fuerte",
    description: "Tu primer post en el muro.",
    iconRef: "comment",
    pointsBonus: 5,
    triggerKey: "first_post",
    impact: "low",
  },
  {
    id: "S02",
    category: "social",
    name: "Popular",
    description: "Conseguiste 10 reacciones en un solo post.",
    iconRef: "heart",
    pointsBonus: 5,
    triggerKey: "post_10_reactions",
    impact: "low",
  },
  {
    id: "S03",
    category: "social",
    name: "Embajador",
    description: "Compartiste 5 prodes fuera de la app.",
    iconRef: "share",
    pointsBonus: 10,
    triggerKey: "external_shares_5",
    impact: "medium",
  },
  {
    id: "S04",
    category: "social",
    name: "Conector",
    description: "Comentaste en 10 posts distintos.",
    iconRef: "comment",
    pointsBonus: 5,
    triggerKey: "comments_made_10",
    impact: "low",
  },
  {
    id: "S05",
    category: "social",
    name: "Tribu",
    description: "Tres amigos tuyos del gym también activaron la app.",
    iconRef: "nav-user",
    pointsBonus: 10,
    triggerKey: "friends_active_3",
    impact: "low",
  },

  // ─── Position ──────────────────────────────────────────────────────
  {
    id: "P01",
    category: "position",
    name: "Top 10",
    description: "Llegaste al top 10 del ranking.",
    iconRef: "nav-chart",
    pointsBonus: 0, // insignia: la posición no da puntos (sale de los puntos)
    triggerKey: "position_top_10",
    impact: "medium",
  },
  {
    id: "P02",
    category: "position",
    name: "Podio",
    description: "Llegaste al top 3 del ranking.",
    iconRef: "medal",
    pointsBonus: 0, // insignia
    triggerKey: "position_top_3",
    impact: "high",
  },
  {
    id: "P03",
    category: "position",
    name: "Líder",
    description: "Liderás el ranking general.",
    iconRef: "crown",
    pointsBonus: 0, // insignia
    triggerKey: "position_1",
    impact: "high",
  },
  {
    id: "P04",
    category: "position",
    name: "Remontada",
    description: "Subiste 10 o más posiciones en una semana.",
    iconRef: "arrow-up",
    pointsBonus: 15,
    triggerKey: "weekly_rise_10",
    impact: "medium",
  },
  // P05 "Campeón" se eliminó: no tiene sentido darle MÁS puntos al que ya ganó
  // el ranking (circular). Los puntos de los logros de posición ahora los define
  // el admin desde el panel (achievement_catalog.points_bonus).
] as const;

// ─── Lookup helpers ──────────────────────────────────────────────────

export const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
export const ACHIEVEMENT_BY_TRIGGER = new Map(ACHIEVEMENTS.map((a) => [a.triggerKey, a]));

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_BY_ID.get(id);
}

export function getAchievementsByCategory(category: AchievementCategory): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}
