/**
 * O2 PRODE — Cron: sync-results (football-data.org)
 *
 * GET/POST /api/cron/sync-results · Bearer CRON_SECRET
 *
 * Trae los 104 partidos del Mundial 2026 desde football-data.org y:
 *  - actualiza status/horario de cada partido,
 *  - CREA los cruces de eliminatorias a medida que se definen (fases se
 *    desbloquean solas),
 *  - al finalizar un partido inserta match_result + lo marca 'finished', lo que
 *    dispara fn_settle_match (puntúa predicciones → recalcula ranking).
 *
 * Clave de cruce: match.fd_id (id de football-data.org). Para los partidos de
 * grupos ya seeded, el backfill (scripts) setea fd_id la primera vez.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWcMatches, type FdMatch } from "@/lib/football-api/client";
import { TLA_TO_CODE, stageToPhase, fdStatusToMatch } from "@/lib/football-api/team-map";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authOk(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

type DbMatch = {
  id: string;
  fd_id: number | null;
  home_code: string;
  away_code: string;
  status: string;
  phase: string;
};

interface SyncChange {
  fdId: number;
  action: "created" | "set_live" | "set_finished" | "set_postponed" | "linked";
  detail?: string;
}

async function handle(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  let fixtures: FdMatch[];
  try {
    fixtures = await getWcMatches();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const { data: tournament } = await supabase.from("tournament").select("id").limit(1).maybeSingle();
  const tournamentId = tournament?.id as string | undefined;

  const { data: dbMatchesRaw } = await supabase
    .from("match")
    .select("id, fd_id, home_code, away_code, status, phase");
  const dbMatches = (dbMatchesRaw ?? []) as DbMatch[];

  const byFdId = new Map<number, DbMatch>();
  for (const m of dbMatches) if (m.fd_id != null) byFdId.set(m.fd_id, m);

  // Índice por par de equipos (ordenado) para enganchar partidos de grupos que
  // todavía no tienen fd_id (primera corrida sin backfill).
  const pairKey = (a: string, b: string) => [a, b].sort().join("|");
  const byPair = new Map<string, DbMatch>();
  for (const m of dbMatches) byPair.set(pairKey(m.home_code, m.away_code), m);

  const changes: SyncChange[] = [];
  const finishedNotifs: Array<{ homeCode: string; awayCode: string; h: number; a: number }> = [];

  for (const fx of fixtures) {
    const homeTla = fx.homeTeam?.tla;
    const awayTla = fx.awayTeam?.tla;
    if (!homeTla || !awayTla) continue; // equipos aún sin definir (cruce futuro)

    const homeCode = TLA_TO_CODE[homeTla];
    const awayCode = TLA_TO_CODE[awayTla];
    if (!homeCode || !awayCode) continue;

    const phase = stageToPhase(fx.stage);
    const status = fdStatusToMatch(fx.status);
    if (!phase || !status) continue;

    // Enganchar el partido local
    let db = byFdId.get(fx.id) ?? byPair.get(pairKey(homeCode, awayCode));

    if (!db) {
      // Cruce nuevo (eliminatorias recién definidas) → crear
      if (!tournamentId) continue;
      const { data: inserted } = await supabase
        .from("match")
        .insert({
          tournament_id: tournamentId,
          phase,
          home_code: homeCode,
          away_code: awayCode,
          kickoff_at: fx.utcDate,
          status: status === "finished" ? "scheduled" : status, // si llega ya finished, settle abajo
          fd_id: fx.id,
        })
        .select("id, fd_id, home_code, away_code, status, phase")
        .single();
      if (!inserted) continue;
      db = inserted as DbMatch;
      changes.push({ fdId: fx.id, action: "created", detail: `${homeCode} vs ${awayCode} (${phase})` });
    } else if (db.fd_id == null) {
      // Vincular fd_id + refrescar horario
      await supabase.from("match").update({ fd_id: fx.id, kickoff_at: fx.utcDate }).eq("id", db.id);
      db.fd_id = fx.id;
      changes.push({ fdId: fx.id, action: "linked" });
    }

    // ── En vivo ──
    if (status === "live" && db.status === "scheduled") {
      await supabase.from("match").update({ status: "live" }).eq("id", db.id);
      changes.push({ fdId: fx.id, action: "set_live" });
    }

    // ── Postergado ──
    if (status === "postponed" && db.status === "scheduled") {
      await supabase.from("match").update({ status: "postponed" }).eq("id", db.id);
      changes.push({ fdId: fx.id, action: "set_postponed" });
    }

    // ── Finalizado ──
    if (status === "finished" && db.status !== "finished") {
      const gh = fx.score?.fullTime?.home;
      const ga = fx.score?.fullTime?.away;
      if (gh == null || ga == null) continue;

      // Mapear goles al orden home/away de NUESTRA fila (puede estar invertido)
      let dbHome: number, dbAway: number;
      if (homeCode === db.home_code) {
        dbHome = gh;
        dbAway = ga;
      } else {
        dbHome = ga;
        dbAway = gh;
      }

      const { error: rErr } = await supabase.from("match_result").upsert(
        { match_id: db.id, home_score: dbHome, away_score: dbAway, finished_at: new Date().toISOString() },
        { onConflict: "match_id" }
      );
      if (rErr) continue;

      // Marcar finished dispara fn_settle_match (puntúa + recalcula ranking)
      const { error: mErr } = await supabase.from("match").update({ status: "finished" }).eq("id", db.id);
      if (!mErr) {
        changes.push({ fdId: fx.id, action: "set_finished", detail: `${db.home_code} ${dbHome}-${dbAway} ${db.away_code}` });
        finishedNotifs.push({ homeCode: db.home_code, awayCode: db.away_code, h: dbHome, a: dbAway });
      }
    }
  }

  for (const n of finishedNotifs) {
    await sendMatchResultNotifications(supabase, n.homeCode, n.awayCode, n.h, n.a);
  }
  await sendUpcomingMatchNotifications(supabase);
  if (changes.some((c) => c.action === "set_finished")) {
    await supabase.rpc("fn_refresh_views");
  }

  return NextResponse.json({ ok: true, processed: fixtures.length, changes: changes.length, detail: changes });
}

// ─── Notificaciones ───────────────────────────────────────────────────

async function sendMatchResultNotifications(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  homeCode: string,
  awayCode: string,
  homeScore: number,
  awayScore: number
) {
  const { data: users } = await supabase.from("user").select("id").is("deleted_at", null);
  if (!users?.length) return;
  const notifs = users.map((u: { id: string }) => ({
    user_id: u.id,
    type: "match-result",
    title: "Resultado del partido",
    body: `${homeCode.toUpperCase()} ${homeScore} - ${awayScore} ${awayCode.toUpperCase()} · Mirá tus puntos`,
    deep_link: "/app",
  }));
  for (let i = 0; i < notifs.length; i += 100) {
    await supabase.from("notification").insert(notifs.slice(i, i + 100));
  }
}

async function sendUpcomingMatchNotifications(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const now = new Date();
  const in60min = new Date(now.getTime() + 60 * 60 * 1000);
  const in30min = new Date(now.getTime() + 30 * 60 * 1000);

  const { data: upcomingMatches } = await supabase
    .from("match")
    .select("id, home_code, away_code, kickoff_at")
    .eq("status", "scheduled")
    .gte("kickoff_at", in30min.toISOString())
    .lte("kickoff_at", in60min.toISOString());
  if (!upcomingMatches?.length) return;

  for (const match of upcomingMatches) {
    const { data: usersWithPred } = await supabase
      .from("prediction")
      .select("user_id")
      .eq("match_id", match.id);
    const predicted = new Set((usersWithPred ?? []).map((p: { user_id: string }) => p.user_id));
    const { data: allUsers } = await supabase.from("user").select("id").is("deleted_at", null);
    const without = (allUsers ?? []).filter((u: { id: string }) => !predicted.has(u.id));
    if (!without.length) continue;
    const notifs = without.map((u: { id: string }) => ({
      user_id: u.id,
      type: "match-upcoming",
      title: "¡Partido en 1 hora!",
      body: `${match.home_code.toUpperCase()} vs ${match.away_code.toUpperCase()} · Cargá tu predicción`,
      deep_link: "/app/prode",
    }));
    for (let i = 0; i < notifs.length; i += 100) {
      await supabase.from("notification").insert(notifs.slice(i, i + 100));
    }
  }
}

export const GET = handle;
export const POST = handle;
