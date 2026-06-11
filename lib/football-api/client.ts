/**
 * O2 PRODE — Football data · HTTP client (football-data.org v4)
 *
 * Auth: header X-Auth-Token. Competición: WC (FIFA World Cup), temporada 2026.
 * Plan premium: live + 20 req/min. El cron trae los 104 partidos en 1 request.
 */

const BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC";
const SEASON = 2026;

function token(): string {
  const t = process.env.FOOTBALL_DATA_TOKEN;
  if (!t) throw new Error("FOOTBALL_DATA_TOKEN no configurada");
  return t;
}

async function fdFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": token() },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`football-data.org ${res.status} en ${path}`);
  }
  return (await res.json()) as T;
}

// ─── Types (subset que usamos) ────────────────────────────────────────

export interface FdMatch {
  id: number;
  utcDate: string;
  /** SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED, SUSPENDED, POSTPONED, CANCELLED, AWARDED */
  status: string;
  /** GROUP_STAGE, LAST_32, LAST_16, QUARTER_FINALS, SEMI_FINALS, THIRD_PLACE, FINAL */
  stage: string;
  group: string | null;
  homeTeam: { id: number | null; name: string | null; tla: string | null };
  awayTeam: { id: number | null; name: string | null; tla: string | null };
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
  };
  /** Última actualización del fixture en football-data (diagnóstico de latencia). */
  lastUpdated?: string;
}

interface FdMatchesResponse {
  matches: FdMatch[];
  resultSet?: { count: number; played: number };
}

/** Todos los partidos del Mundial 2026 (1 request). */
export async function getWcMatches(): Promise<FdMatch[]> {
  const data = await fdFetch<FdMatchesResponse>(
    `/competitions/${COMPETITION}/matches?season=${SEASON}`
  );
  return data.matches ?? [];
}
