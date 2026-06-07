/**
 * O2 PRODE — Share System · TypeScript Interfaces
 * Agente 5 · Viral Share Designer
 *
 * Data shapes for each share template. Consumed by:
 * - app/api/share/[template]/[userId]/route.ts (edge handler)
 * - app/components/share/templates/* (Satori JSX templates)
 */

// ─── Common ──────────────────────────────────────────────────────────

export type ShareTemplateId = "summary" | "position" | "match" | "achievement";

export type ShareFormat = "story" | "square";

export type AchievementCategory = "skill" | "consistency" | "social" | "position";

export type UserLevel = 1 | 2 | 3 | 4 | 5;

/** Common fields present in every share template. */
export interface ShareUserCore {
  userId: string;
  userName: string;
  /** Two-letter initials computed from userName, e.g. "Nahuel Carrera" → "NC". */
  userInitials: string;
  userLevel: UserLevel;
  /** Display name of the level: Rookie / Aplicado / Pro / Crack / Leyenda O2 */
  userLevelName: string;
}

export interface TeamRef {
  country: string; // Display name in es-AR ("Argentina", "Países Bajos")
  flagCode: string; // Sprite ID without prefix ("ar", "br", "nl")
}

export interface PlayerRef {
  name: string; // Display name ("Mbappé", "Messi")
  country: string; // Selection country
  flagCode: string;
}

// ─── T01: Summary ────────────────────────────────────────────────────

export interface SummaryShareData extends ShareUserCore {
  template: "summary";
  champion: TeamRef;
  topScorer: PlayerRef;
  finalResult: {
    home: TeamRef;
    away: TeamRef;
    score: readonly [number, number];
  };
  points: number;
  position: number;
  /**
   * Computed: true if champion.flagCode === "ar".
   * Activates Sol de Mayo overlay + celeste tint on Argentina text.
   */
  isArgentinaChampion: boolean;
}

// ─── T02: Position ───────────────────────────────────────────────────

export interface PositionShareData extends ShareUserCore {
  template: "position";
  position: number;
  points: number;
  totalSocios: number;
  /** Positive = subió, negative = bajó, 0 = igual */
  deltaPosition: number;
  weekPoints: number;
  weekNumber: number;
}

// ─── T03: Match ──────────────────────────────────────────────────────

export interface MatchShareData extends ShareUserCore {
  template: "match";
  tournament: "Mundial 2026";
  /** "Grupo A" / "Octavos" / "Cuartos" / "Semifinal" / "Final" */
  phase: string;
  home: TeamRef;
  away: TeamRef;
  predictedScore: readonly [number, number];
  /**
   * Solo revelar el marcador predicho si el partido ya arrancó/terminó.
   * Antes del kickoff es secreto (anti-copia + cierra el IDOR del endpoint
   * público de share, que dejaba leer la predicción de cualquier socio).
   */
  revealScore: boolean;
  /** ISO 8601 datetime of kickoff. Rendered in es-AR. */
  kickoffISO: string;
  userPosition: number;
}

// ─── T04: Achievement ────────────────────────────────────────────────

export interface AchievementShareData extends ShareUserCore {
  template: "achievement";
  achievementId: string;
  achievementName: string;
  achievementCategory: AchievementCategory;
  achievementDescription: string;
  /**
   * Sprite key in design/icons.svg.
   * Examples: "flame" (streak), "target" (precision), "crown" (rank), "medal" (podium).
   */
  iconRef: string;
  /** ISO 8601 datetime of unlock. */
  unlockedAt: string;
}

// ─── Union ───────────────────────────────────────────────────────────

export type ShareData =
  | SummaryShareData
  | PositionShareData
  | MatchShareData
  | AchievementShareData;

export interface ShareRequest {
  data: ShareData;
  format: ShareFormat;
}

// ─── Type guards ─────────────────────────────────────────────────────

export const isSummaryShare = (d: ShareData): d is SummaryShareData => d.template === "summary";
export const isPositionShare = (d: ShareData): d is PositionShareData => d.template === "position";
export const isMatchShare = (d: ShareData): d is MatchShareData => d.template === "match";
export const isAchievementShare = (d: ShareData): d is AchievementShareData =>
  d.template === "achievement";

// ─── Canvas constants ────────────────────────────────────────────────

export const SHARE_CANVAS = {
  story: { width: 1080, height: 1920 } as const,
  square: { width: 1080, height: 1080 } as const,
} as const;

export const SHARE_SAFE_BAND = {
  /** Vertical band (in 9:16 canonical) that survives the crop to 1:1. */
  topPercent: 20,
  bottomPercent: 80,
} as const;

// ─── Template metadata (for UI: which templates apply when) ──────────

export interface TemplateMetadata {
  id: ShareTemplateId;
  label: string;
  description: string;
  /** When to offer this template. */
  offerWhen: string;
  /** Whether the template requires a contextId (matchId, achievementId, etc.) */
  requiresContext: boolean;
}

export const TEMPLATE_CATALOG: readonly TemplateMetadata[] = [
  {
    id: "summary",
    label: "Resumen general",
    description:
      "Campeón, goleador y final predichos + puntos y posición. Hero variant con Sol de Mayo si predijiste Argentina campeón.",
    offerWhen: "Tras completar la predicción inicial. Automático al cierre del torneo.",
    requiresContext: false,
  },
  {
    id: "position",
    label: "Mi posición",
    description: "Tu puesto y puntos destacados. Bueno para presumir un salto en el ranking.",
    offerWhen: "Cuando subís ≥3 posiciones / entrás al top 10 / siempre disponible.",
    requiresContext: false,
  },
  {
    id: "match",
    label: "Predicción de partido",
    description: "Tu predicción de un partido específico antes del kickoff.",
    offerWhen: "Cuando cargás un partido importante (Argentina, finales, etc).",
    requiresContext: true,
  },
  {
    id: "achievement",
    label: "Logro desbloqueado",
    description: "Acabás de ganar un logro y querés mostrarlo.",
    offerWhen: "Inmediatamente al desbloquear (sugerido en modal de celebración).",
    requiresContext: true,
  },
] as const;
