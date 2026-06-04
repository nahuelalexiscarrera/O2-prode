/**
 * O2 PRODE — Cron: sync-results
 *
 * GET/POST /api/cron/sync-results
 *
 * Sincroniza resultados del Mundial 2026 desde API-Football hacia la DB local.
 * La cadena de automatización ya existe en Postgres:
 *   match.status → 'finished'
 *   → trigger trg_match_status_change
 *   → fn_settle_match (calcula puntos de predicciones)
 *   → fn_recalculate_positions (actualiza ranking)
 *
 * Este cron es el único eslabón que faltaba: detectar el resultado y
 * actualizar match.status + insertar match_result.
 *
 * Protegido por Authorization: Bearer <CRON_SECRET>.
 *
 * Consumo de cuota API-Football (plan free: 100 req/día):
 *   - Días sin partidos: 0 llamadas (se corta temprano al no haber matches hoy)
 *   - Días con partidos: 1-2 llamadas (live + finished)
 *   - Worst case: ~15 req/día en semana pico de grupos
 */

import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFixturesByStatus, type ApiFixture } from "@/lib/football-api/client";
import { TEAM_CODE_TO_API_ID, WC_LEAGUE_ID, WC_SEASON } from "@/lib/football-api/team-map";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Auth ────────────────────────────────────────────────────────────

function authOk(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Invierte el team-map: API numeric ID → our ISO code */
function buildApiIdToCode(): Record<number, string> {
  const map: Record<number, string> = {};
  for (const [code, id] of Object.entries(TEAM_CODE_TO_API_ID)) {
    map[id] = code;
  }
  return map;
}

const API_ID_TO_CODE = buildApiIdToCode();

/**
 * Convierte los status de API-Football a nuestros match_status_t.
 * FT, AET, PEN → "finished"
 * 1H, HT, 2H, ET → "live"
 * NS, TBD       → "scheduled"
 * PST, CANC     → "postponed"
 */
function mapStatus(apiStatus: string): "scheduled" | "live" | "finished" | "postponed" | null {
  switch (apiStatus) {
    case "FT":
    case "AET":
    case "PEN":
      return "finished";
    case "1H":
    case "HT":
    case "2H":
    case "ET":
    case "P":
      return "live";
    case "NS":
    case "TBD":
      return "scheduled";
    case "PST":
    case "CANC":
    case "SUSP":
    case "ABD":
    case "AWD":
    case "WO":
      return "postponed";
    default:
      return null;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────

interface SyncResult {
  matchId: string;
  homeCode: string;
  awayCode: string;
  action: "set_live" | "set_finished" | "set_postponed";
  score?: string;
}

async function handle(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // ── 1. Verificar si hay partidos hoy (evitar llamadas innecesarias a la API) ──
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const { data: todayMatches, error: tmErr } = await supabase
    .from("match")
    .select("id")
    .gte("kickoff_at", todayStart.toISOString())
    .lt("kickoff_at", tomorrowStart.toISOString())
    .limit(1);

  if (tmErr) {
    return NextResponse.json({ error: tmErr.message }, { status: 500 });
  }

  // También verificar si hay partidos en vivo o recientes (últimas 4 horas)
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const { data: recentMatches } = await supabase
    .from("match")
    .select("id")
    .in("status", ["live", "scheduled"])
    .gte("kickoff_at", fourHoursAgo.toISOString())
    .limit(1);

  const hasActivityToday = (todayMatches?.length ?? 0) > 0 || (recentMatches?.length ?? 0) > 0;

  if (!hasActivityToday) {
    return NextResponse.json({
      ok: true,
      skipped: "No hay partidos hoy ni partidos recientes pendientes. Cuota de API conservada.",
    });
  }

  // ── 2. Obtener fixtures en vivo y finalizados desde API-Football ──
  const [liveFixtures, finishedFixtures] = await Promise.all([
    getFixturesByStatus(WC_LEAGUE_ID, WC_SEASON, "1H,HT,2H,ET,P").catch(() => [] as ApiFixture[]),
    getFixturesByStatus(WC_LEAGUE_ID, WC_SEASON, "FT,AET,PEN").catch(() => [] as ApiFixture[]),
  ]);

  const allFixtures = [...liveFixtures, ...finishedFixtures];

  if (allFixtures.length === 0) {
    return NextResponse.json({ ok: true, message: "Sin partidos activos en la API en este momento." });
  }

  // ── 3. Obtener partidos locales no finalizados ──
  const { data: localMatches, error: lmErr } = await supabase
    .from("match")
    .select("id, home_code, away_code, kickoff_at, status")
    .in("status", ["scheduled", "live"])
    .order("kickoff_at", { ascending: true });

  if (lmErr) {
    return NextResponse.json({ error: lmErr.message }, { status: 500 });
  }

  const results: SyncResult[] = [];

  // ── 4. Cruzar partidos de API con partidos locales ──
  for (const fixture of allFixtures) {
    const apiHomeId = fixture.teams.home.id;
    const apiAwayId = fixture.teams.away.id;
    const homeCode = API_ID_TO_CODE[apiHomeId];
    const awayCode = API_ID_TO_CODE[apiAwayId];

    // Si no podemos mapear los equipos, salteamos
    if (!homeCode || !awayCode) continue;

    // Buscar partido local por equipos (fecha es referencial, el par es único en fase grupos)
    const localMatch = localMatches?.find(
      (m) => m.home_code === homeCode && m.away_code === awayCode
    );

    if (!localMatch) continue;

    const apiStatus = fixture.fixture.status.short;
    const mappedStatus = mapStatus(apiStatus);
    if (!mappedStatus) continue;

    // ── 4a. Partido en vivo → marcar como live ──
    if (mappedStatus === "live" && localMatch.status === "scheduled") {
      const { error } = await supabase
        .from("match")
        .update({ status: "live" })
        .eq("id", localMatch.id);

      if (!error) {
        results.push({ matchId: localMatch.id, homeCode, awayCode, action: "set_live" });
      }
    }

    // ── 4b. Partido finalizado → guardar resultado + marcar finished ──
    if (mappedStatus === "finished" && localMatch.status !== "finished") {
      const homeScore = fixture.goals.home;
      const awayScore = fixture.goals.away;

      if (homeScore === null || awayScore === null) continue;

      // Insertar resultado (el trigger SQL hace el settle automáticamente)
      const { error: rErr } = await supabase
        .from("match_result")
        .upsert(
          {
            match_id: localMatch.id,
            home_score: homeScore,
            away_score: awayScore,
            finished_at: new Date().toISOString(),
          },
          { onConflict: "match_id" }
        );

      if (rErr) continue;

      // Actualizar status (dispara el trigger trg_match_status_change → fn_settle_match)
      const { error: mErr } = await supabase
        .from("match")
        .update({ status: "finished" })
        .eq("id", localMatch.id);

      if (!mErr) {
        const score = `${homeScore}-${awayScore}`;
        results.push({ matchId: localMatch.id, homeCode, awayCode, action: "set_finished", score });

        // ── 4c. Notificación de resultado a todos los usuarios ──
        await sendMatchResultNotifications(supabase, homeCode, awayCode, homeScore, awayScore);
      }
    }

    // ── 4d. Partido postergado ──
    if (mappedStatus === "postponed" && localMatch.status === "scheduled") {
      await supabase
        .from("match")
        .update({ status: "postponed" })
        .eq("id", localMatch.id);
      results.push({ matchId: localMatch.id, homeCode, awayCode, action: "set_postponed" });
    }
  }

  // ── 5. Notificaciones de partido próximo (en los próximos 60 min) ──
  await sendUpcomingMatchNotifications(supabase);

  // ── 6. Refresh de vistas materializadas si hubo resultados ──
  if (results.some((r) => r.action === "set_finished")) {
    await supabase.rpc("fn_refresh_views");
  }

  return NextResponse.json({
    ok: true,
    processed: allFixtures.length,
    changes: results.length,
    results,
  });
}

// ─── Notificaciones de resultado ─────────────────────────────────────

async function sendMatchResultNotifications(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  homeCode: string,
  awayCode: string,
  homeScore: number,
  awayScore: number
) {
  // Obtener todos los usuarios activos
  const { data: users } = await supabase
    .from("user")
    .select("id")
    .is("deleted_at", null);

  if (!users?.length) return;

  const notifs = users.map((u: { id: string }) => ({
    user_id: u.id,
    type: "match-result",
    title: "Resultado del partido",
    body: `${homeCode.toUpperCase()} ${homeScore} - ${awayScore} ${awayCode.toUpperCase()} · Chequeá tus puntos`,
    deep_link: "/app",
  }));

  // Insertar en batches de 100 para evitar límites de payload
  for (let i = 0; i < notifs.length; i += 100) {
    await supabase.from("notification").insert(notifs.slice(i, i + 100));
  }
}

// ─── Notificaciones de partido próximo ───────────────────────────────

async function sendUpcomingMatchNotifications(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const now = new Date();
  const in60min = new Date(now.getTime() + 60 * 60 * 1000);
  const in30min = new Date(now.getTime() + 30 * 60 * 1000);

  // Partidos que empiezan entre 30 y 60 minutos
  const { data: upcomingMatches } = await supabase
    .from("match")
    .select("id, home_code, away_code, kickoff_at")
    .eq("status", "scheduled")
    .gte("kickoff_at", in30min.toISOString())
    .lte("kickoff_at", in60min.toISOString());

  if (!upcomingMatches?.length) return;

  for (const match of upcomingMatches) {
    // Usuarios que NO tienen predicción para este partido
    const { data: usersWithPred } = await supabase
      .from("prediction")
      .select("user_id")
      .eq("match_id", match.id);

    const predictedUserIds = new Set((usersWithPred ?? []).map((p: { user_id: string }) => p.user_id));

    const { data: allUsers } = await supabase
      .from("user")
      .select("id")
      .is("deleted_at", null);

    const usersWithoutPred = (allUsers ?? []).filter(
      (u: { id: string }) => !predictedUserIds.has(u.id)
    );

    if (!usersWithoutPred.length) continue;

    const notifs = usersWithoutPred.map((u: { id: string }) => ({
      user_id: u.id,
      type: "match-upcoming",
      title: "¡Partido en 1 hora!",
      body: `${match.home_code.toUpperCase()} vs ${match.away_code.toUpperCase()} · Cargá tu predicción antes del cierre`,
      deep_link: "/app/prode",
    }));

    for (let i = 0; i < notifs.length; i += 100) {
      await supabase.from("notification").insert(notifs.slice(i, i + 100));
    }
  }
}

// ─── Exports (Vercel Cron dispara GET; POST para invocación manual) ──

export const GET = handle;
export const POST = handle;
