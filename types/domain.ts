/**
 * O2 PRODE — Domain Types
 * Agente 8 · Data Modeler
 *
 * Clean domain layer. Components and lib/* consume these.
 * Database types (auto-generated) live in `types/database.ts`.
 */

// ─── Enums and unions ───────────────────────────────────────────────

export type Phase = "groups" | "round-of-16" | "quarter" | "semi" | "final";

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

export type UserLevel = 1 | 2 | 3 | 4 | 5;

export type AchievementCategory = "skill" | "consistency" | "social" | "position";

export type AchievementState = "locked" | "in_progress" | "unlocked";

export type ReactionTarget = "post" | "comment";

export type Visibility = "public" | "private";

// ─── Foundational ───────────────────────────────────────────────────

export interface Tournament {
  id: string;
  slug: string; // 'mundial-2026'
  displayName: string;
  shortName: string; // 'Mundial 2026'
  startDate: string; // ISO date
  endDate: string;
  phaseConfig: PhaseConfig;
  active: boolean;
}

export interface PhaseConfig {
  groups: { label: string; multiplier: number };
  "round-of-16": { label: string; multiplier: number };
  quarter: { label: string; multiplier: number };
  semi: { label: string; multiplier: number };
  final: { label: string; multiplier: number };
}

export interface Group {
  id: string; // 'A', 'B', ... 'L'
  tournamentId: string;
  letter: string;
  teamCodes: string[]; // length 4
}

export interface Team {
  code: string; // ISO alpha-2 lowercase
  name: string;
  groupId: string | null;
}

export interface Player {
  id: string;
  name: string; // 'Mbappé', 'Messi'
  fullName: string; // 'Kylian Mbappé Lottin'
  teamCode: string;
}

// ─── User & auth ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  level: UserLevel;
  levelName: string; // "Rookie", "Aplicado", "Pro", "Crack", "Leyenda O2"
  totalPoints: number;
  position: number;
  joinedAt: string;
  inviteCodeUsed: string;
  notificationPrefs: NotificationPrefs;
  visibility: Visibility;
  deletedAt: string | null;
}

export interface NotificationPrefs {
  matchReminders: boolean;
  results: boolean;
  socialReactions: boolean;
  weeklyDigest: boolean;
}

export interface InviteCode {
  code: string; // e.g. 'O2-2026-NHL'
  createdBy: string; // admin user id
  used: boolean;
  usedBy: string | null;
  expiresAt: string;
  createdAt: string;
}

// ─── Matches ────────────────────────────────────────────────────────

export interface Match {
  id: string;
  tournamentId: string;
  phase: Phase;
  groupId: string | null;
  homeTeamCode: string;
  awayTeamCode: string;
  kickoffISO: string;
  venueCity: string | null;
  status: MatchStatus;
  lockoutISO: string; // computed: kickoff - 1h
}

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  topScorerPlayerId: string | null;
  finishedAt: string;
}

// ─── Predictions ────────────────────────────────────────────────────

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  pointsEarned: number | null; // null until match is finished + scoring runs
  pointsBreakdown: PointsBreakdown | null;
  createdAt: string;
  updatedAt: string;
}

export interface PointsBreakdown {
  exactResult: number; // 8 if hit exact, else 0
  winnerCorrect: number; // 3 if winner ok and no exact
  drawCorrect: number; // 1 if draw without exact
  diffBonus: number; // +2 if goal diff matches and no exact
  phaseMultiplier: number; // 1 / 2 / 3 / 4 / 5
  total: number; // computed total after multiplier
}

export interface SpecialPrediction {
  userId: string;
  tournamentId: string;
  championTeamCode: string;
  runnerUpTeamCode: string;
  topScorerPlayerId: string;
  groupStageBestTeamCode: string;
  revelationTeamCode: string;
  lockedAt: string; // when tournament started, can no longer edit
  pointsEarned: number | null;
}

// ─── Social: posts, comments, reactions ─────────────────────────────

export interface Post {
  id: string;
  userId: string;
  body: string; // max 280 chars
  embedType: "prediction" | "match" | null;
  embedRefId: string | null;
  imageUrl: string | null; // optional uploaded image (Supabase Storage)
  imageWidth: number | null;
  imageHeight: number | null;
  reactionCount: number;
  commentCount: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  body: string; // max 280 chars
  reactionCount: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface Reaction {
  targetType: ReactionTarget;
  targetId: string;
  userId: string;
  createdAt: string;
}

// ─── Achievements & gamification ────────────────────────────────────

export interface AchievementCatalogItem {
  id: string; // 'A01', 'C01', 'S01', 'P01'
  category: AchievementCategory;
  name: string;
  description: string;
  iconRef: string; // sprite key
  pointsBonus: number;
  triggerKey: string;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
  shared: boolean;
  progress?: number; // 0-100 for in_progress display
}

// ─── Ranking ────────────────────────────────────────────────────────

export interface RankingEntry {
  position: number;
  userId: string;
  userName: string;
  userInitials: string;
  avatarUrl: string | null;
  level: UserLevel;
  points: number;
  delta: number; // change vs last week (positive = up)
}

export interface RankingSnapshot {
  id: string;
  weekNumber: number;
  snapshotAt: string;
  entries: RankingEntry[];
}

// ─── Notifications ──────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  /** Inventario del Agente 2 §9.1: N01..N12 */
  type:
    | "onboarding-incomplete"
    | "match-upcoming"
    | "phase-start"
    | "match-result"
    | "reaction"
    | "comment"
    | "achievement-unlocked"
    | "close-to-podium"
    | "position-change"
    | "weekly-digest"
    | "tournament-end"
    | "share-reminder";
  title: string;
  body: string;
  deepLink: string;
  readAt: string | null;
  createdAt: string;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dhKey: string;
  authKey: string;
  userAgent: string;
  createdAt: string;
  lastSeenAt: string;
}

// ─── Telemetry ──────────────────────────────────────────────────────

export interface ShareIntent {
  id: string;
  userId: string;
  template: "summary" | "position" | "match" | "achievement";
  channel: "instagram" | "whatsapp" | "download" | "more";
  contextId: string | null; // matchId or achievementId when applicable
  createdAt: string;
}
