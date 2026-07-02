/**
 * O2 PRODE — Motor de métricas del reporte de fase (brief §3).
 *
 * Dos capas:
 *   - fetchPhaseData(admin, phase): I/O read-only a Supabase (paginado).
 *   - aggregate(raw): FUNCIÓN PURA que deriva el PhaseMetrics. Sin I/O → testeable.
 *
 * computeMetrics = aggregate(await fetchPhaseData(...)).
 */

import { REPORTS, closingForPhase } from "@/lib/i18n/reports";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type InteractionTrend,
  type KpiDelta,
  PHASE_ORDER,
  type PhaseMetrics,
  type PhaseWinner,
  type TournamentPhase,
} from "./types";

type Admin = ReturnType<typeof createAdminClient>;

// ─── Raw (entrada de aggregate) ─────────────────────────────────────────────

export interface RawMatch {
  id: string;
  phase: TournamentPhase;
  kickoffAt: string;
  homeScore: number | null;
  awayScore: number | null;
  finishedAt: string | null;
}
export interface RawPrediction {
  userId: string;
  matchId: string;
  createdAt: string;
  homeScore: number;
  awayScore: number;
}
export interface RawUser {
  id: string;
  joinedAt: string;
}
export interface RawPhaseData {
  phase: TournamentPhase;
  prevPhase: TournamentPhase | null;
  /** current + prev phase matches (con su resultado si existe) */
  matches: RawMatch[];
  /** predicciones de esos matches (current + prev) */
  predictions: RawPrediction[];
  /** todos los socios no borrados (para new/total/participación/cumulativo) */
  users: RawUser[];
  /** predicciones acumuladas por usuario en TODO el torneo (para P90 "power") */
  tournamentPredCountByUser: Record<string, number>;
  winners: PhaseWinner[];
}

// ─── Helpers puros ──────────────────────────────────────────────────────────

const TZ = "America/Argentina/Buenos_Aires";
const sgn = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function fmtDay(iso: string): number {
  return Number(new Date(iso).toLocaleDateString("es-AR", { day: "numeric", timeZone: TZ }));
}
function fmtMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { month: "long", timeZone: TZ });
}
/** "del 11 al 28 de junio" · "del 28 de junio al 5 de julio" */
export function formatPeriodEs(startISO: string, endISO: string): string {
  const sm = fmtMonth(startISO);
  const em = fmtMonth(endISO);
  const sd = fmtDay(startISO);
  const ed = fmtDay(endISO);
  return sm === em ? `del ${sd} al ${ed} de ${em}` : `del ${sd} de ${sm} al ${ed} de ${em}`;
}
/** número es-AR con 1 decimal y coma: 55.92 → "55,9" */
export function esDecimal(n: number): string {
  return n.toFixed(1).replace(".", ",");
}
export function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx] ?? 0;
}

interface PeriodBounds {
  start: string;
  end: string;
}
function periodOf(matches: RawMatch[]): PeriodBounds {
  const kickoffs = matches.map((m) => m.kickoffAt).sort();
  const finishes = matches
    .map((m) => m.finishedAt)
    .filter((x): x is string => Boolean(x))
    .sort();
  const start = kickoffs[0] ?? new Date(0).toISOString();
  const end = finishes[finishes.length - 1] ?? kickoffs[kickoffs.length - 1] ?? start;
  return { start, end };
}

interface PhaseCounts {
  activeUsers: number;
  predictionsLoaded: number;
  settled: number;
  correct: number;
  newUsers: number;
  participation: number;
}

/** Cuenta agregada de una fase — reusada para la fase actual y la anterior (deltas). */
function phaseCounts(
  period: PeriodBounds,
  preds: RawPrediction[],
  users: RawUser[],
  resultByMatch: Map<string, RawMatch>
): PhaseCounts {
  const activeUsers = new Set(preds.map((p) => p.userId)).size;
  let settled = 0;
  let correct = 0;
  for (const p of preds) {
    const r = resultByMatch.get(p.matchId);
    if (!r || r.homeScore === null || r.awayScore === null) continue;
    settled++;
    if (sgn(p.homeScore - p.awayScore) === sgn(r.homeScore - r.awayScore)) correct++;
  }
  const newUsers = users.filter(
    (u) => u.joinedAt >= period.start && u.joinedAt <= period.end
  ).length;
  const totalAtEnd = users.filter((u) => u.joinedAt <= period.end).length;
  return {
    activeUsers,
    predictionsLoaded: preds.length,
    settled,
    correct,
    newUsers,
    participation: pct(activeUsers, totalAtEnd),
  };
}

function delta(current: number, prev: number | null): KpiDelta {
  return { current, delta: prev === null ? null : Math.round((current - prev) * 10) / 10 };
}

/**
 * Tendencia de la interacción semanal — para elegir una frase de contexto que
 * NO mienta (§7: confianza total, pero cierto). "growth" si sube claro de punta
 * a punta; "frontloaded" si arrancó en el pico y bajó (típico: pre-cargan todo);
 * "steady" en el resto.
 */
export function interactionTrendOf(values: number[]): InteractionTrend {
  if (values.length < 2) return "steady";
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const peak = Math.max(...values);
  if (last > first * 1.05) return "growth";
  if (first >= peak && last < first * 0.95) return "frontloaded";
  return "steady";
}

// ─── aggregate (pura) ───────────────────────────────────────────────────────

export function aggregate(raw: RawPhaseData): PhaseMetrics {
  const phaseLabel = REPORTS.phase.phaseLabels[raw.phase];
  const resultByMatch = new Map(raw.matches.map((m) => [m.id, m]));

  const curMatches = raw.matches.filter((m) => m.phase === raw.phase);
  const curMatchIds = new Set(curMatches.map((m) => m.id));
  const curPreds = raw.predictions.filter((p) => curMatchIds.has(p.matchId));
  const period = periodOf(curMatches);

  const cur = phaseCounts(period, curPreds, raw.users, resultByMatch);

  // Fase anterior (deltas) — misma cuenta sobre sus matches/preds.
  let prev: PhaseCounts | null = null;
  if (raw.prevPhase) {
    const prevMatches = raw.matches.filter((m) => m.phase === raw.prevPhase);
    const prevMatchIds = new Set(prevMatches.map((m) => m.id));
    const prevPreds = raw.predictions.filter((p) => prevMatchIds.has(p.matchId));
    prev = phaseCounts(periodOf(prevMatches), prevPreds, raw.users, resultByMatch);
  }

  const accuracyPercent = pct(cur.correct, cur.settled);
  const avgPredictionsPerActive =
    cur.activeUsers > 0 ? Math.round((cur.predictionsLoaded / cur.activeUsers) * 10) / 10 : 0;

  // ── Buckets semanales sobre el período de la fase ──
  const startMs = new Date(period.start).getTime();
  const endMs = new Date(period.end).getTime();
  const weekCount = Math.max(1, Math.ceil((endMs - startMs) / WEEK_MS));
  const weekIdx = (iso: string) => {
    const i = Math.floor((new Date(iso).getTime() - startMs) / WEEK_MS);
    return Math.min(weekCount - 1, Math.max(0, i)); // clamp (preds pre-inicio → semana 1)
  };

  const activeByWeek: Array<Set<string>> = Array.from({ length: weekCount }, () => new Set());
  const predsByWeek = new Array<number>(weekCount).fill(0);
  for (const p of curPreds) {
    const w = weekIdx(p.createdAt);
    activeByWeek[w]?.add(p.userId);
    predsByWeek[w] = (predsByWeek[w] ?? 0) + 1;
  }

  const weeklyInteraction = activeByWeek.map((set, i) => ({
    weekLabel: `Semana ${i + 1}`,
    value: set.size,
  }));
  const weeklyPredictions = predsByWeek.map((count, i) => ({
    weekLabel: `Semana ${i + 1}`,
    value: count,
  }));

  const weeklyNewUsers = Array.from({ length: weekCount }, (_, i) => {
    const weekEndMs = i === weekCount - 1 ? endMs : startMs + (i + 1) * WEEK_MS;
    const weekStartMs = startMs + i * WEEK_MS;
    const count = raw.users.filter((u) => {
      const j = new Date(u.joinedAt).getTime();
      return j >= weekStartMs && j <= weekEndMs;
    }).length;
    const cumulative = raw.users.filter((u) => new Date(u.joinedAt).getTime() <= weekEndMs).length;
    return { weekLabel: `Semana ${i + 1}`, count, cumulative };
  });

  // ── userTypeBreakdown (brief §3) ──
  const activeIds = new Set(curPreds.map((p) => p.userId));
  const p90 = percentile(Object.values(raw.tournamentPredCountByUser), 90);
  const userTypeBreakdown = {
    new: raw.users.filter((u) => u.joinedAt >= period.start && u.joinedAt <= period.end).length,
    recurrent: raw.users.filter((u) => activeIds.has(u.id) && u.joinedAt < period.start).length,
    power: [...activeIds].filter((id) => (raw.tournamentPredCountByUser[id] ?? 0) >= p90).length,
  };

  const headlineSummary = `${phaseLabel} cerrada con ${esDecimal(accuracyPercent)}% de acierto.`;

  return {
    phase: raw.phase,
    phaseLabel,
    periodStart: period.start,
    periodEnd: period.end,
    weekLabel: formatPeriodEs(period.start, period.end),
    headlineSummary,
    kpis: {
      activeUsers: delta(cur.activeUsers, prev?.activeUsers ?? null),
      predictionsLoaded: delta(cur.predictionsLoaded, prev?.predictionsLoaded ?? null),
      newUsers: delta(cur.newUsers, prev?.newUsers ?? null),
      participation: delta(cur.participation, prev?.participation ?? null),
    },
    weeklyInteraction,
    interactionTrend: interactionTrendOf(weeklyInteraction.map((b) => b.value)),
    weeklyNewUsers,
    weeklyPredictions,
    avgPredictionsPerActive,
    winners: raw.winners,
    accuracyPercent,
    userTypeBreakdown,
    branchBreakdown: [], // `user` no tiene campo de sucursal hoy → bloque vacío (degrada)
    closingText: closingForPhase(raw.phase),
  };
}

// ─── fetch (I/O) ────────────────────────────────────────────────────────────

/** Paginador: supabase-js corta en 1000 filas por request. */
async function fetchAll<T>(
  build: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const PAGE = 1000;
  let from = 0;
  const out: T[] = [];
  for (;;) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

export async function fetchPhaseData(admin: Admin, phase: TournamentPhase): Promise<RawPhaseData> {
  const idx = PHASE_ORDER.indexOf(phase);
  const prevPhase = idx > 0 ? (PHASE_ORDER[idx - 1] ?? null) : null;
  const phases = prevPhase ? [phase, prevPhase] : [phase];

  // Matches (current + prev) con su resultado embebido.
  const { data: matchRows, error: mErr } = await admin
    .from("match")
    .select("id, phase, kickoff_at, match_result(home_score, away_score, finished_at)")
    .in("phase", phases);
  if (mErr) throw new Error(mErr.message);

  const matches: RawMatch[] = (matchRows ?? []).map((m) => {
    const mr = Array.isArray(m.match_result) ? m.match_result[0] : m.match_result;
    return {
      id: m.id as string,
      phase: m.phase as TournamentPhase,
      kickoffAt: m.kickoff_at as string,
      homeScore: (mr?.home_score ?? null) as number | null,
      awayScore: (mr?.away_score ?? null) as number | null,
      finishedAt: (mr?.finished_at ?? null) as string | null,
    };
  });
  const matchIds = matches.map((m) => m.id);

  // Predicciones de esos matches (paginado).
  const predRows = matchIds.length
    ? await fetchAll<{
        user_id: string;
        match_id: string;
        created_at: string;
        home_score: number;
        away_score: number;
      }>((from, to) =>
        admin
          .from("prediction")
          .select("user_id, match_id, created_at, home_score, away_score")
          .in("match_id", matchIds)
          .range(from, to)
      )
    : [];
  const predictions: RawPrediction[] = predRows.map((p) => ({
    userId: p.user_id,
    matchId: p.match_id,
    createdAt: p.created_at,
    homeScore: p.home_score,
    awayScore: p.away_score,
  }));

  // Todos los socios no borrados.
  const { data: userRows, error: uErr } = await admin
    .from("user")
    .select("id, joined_at")
    .is("deleted_at", null);
  if (uErr) throw new Error(uErr.message);
  const users: RawUser[] = (userRows ?? []).map((u) => ({
    id: u.id as string,
    joinedAt: u.joined_at as string,
  }));

  // Conteo de predicciones por usuario en TODO el torneo (para P90 "power").
  const allPredUserIds = await fetchAll<{ user_id: string }>((from, to) =>
    admin.from("prediction").select("user_id").range(from, to)
  );
  const tournamentPredCountByUser: Record<string, number> = {};
  for (const row of allPredUserIds) {
    tournamentPredCountByUser[row.user_id] = (tournamentPredCountByUser[row.user_id] ?? 0) + 1;
  }

  // Ganadores cargados por el staff.
  const { data: prizeRows, error: pErr } = await admin
    .from("prize_award")
    .select("position, prize_label, user:user_id(name)")
    .eq("phase", phase)
    .order("position", { ascending: true });
  if (pErr) throw new Error(pErr.message);
  const phaseLabel = REPORTS.phase.phaseLabels[phase];
  const winners: PhaseWinner[] = (prizeRows ?? []).map((r) => {
    const u = Array.isArray(r.user) ? r.user[0] : r.user;
    return {
      position: r.position as number,
      name: (u?.name ?? "—") as string,
      prize: r.prize_label as string,
      phaseLabel,
    };
  });

  return { phase, prevPhase, matches, predictions, users, tournamentPredCountByUser, winners };
}

export async function computeMetrics(phase: TournamentPhase): Promise<PhaseMetrics> {
  const admin = createAdminClient();
  const raw = await fetchPhaseData(admin, phase);
  return aggregate(raw);
}
