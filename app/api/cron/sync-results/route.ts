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

import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWcMatches, type FdMatch } from "@/lib/football-api/client";
import { TLA_TO_CODE, stageToPhase, fdStatusToMatch } from "@/lib/football-api/team-map";
import { evaluateMatchSettledForUsers } from "@/lib/achievements/match-settled";
import { reconcilePositionAchievements } from "@/lib/achievements/position-reconcile";
import { broadcastPush } from "@/lib/push/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authOk(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  // AUTH-009: comparación en tiempo constante para prevenir timing attacks.
  // Con === un atacante podría inferir el secreto byte a byte midiendo tiempos.
  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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

  // Índice por par de equipos + FASE para enganchar partidos que todavía no
  // tienen fd_id (primera corrida). Incluye la fase porque en el formato de 48
  // dos selecciones pueden cruzarse en grupos Y de nuevo en eliminatorias: sin
  // la fase, el cruce de knockout matchearía contra la fila de grupos. Además
  // solo indexamos los NO vinculados, para no re-matchear lo ya enganchado.
  const pairKey = (a: string, b: string, phase: string) =>
    `${[a, b].sort().join("|")}::${phase}`;
  const byPair = new Map<string, DbMatch>();
  for (const m of dbMatches) {
    if (m.fd_id == null) byPair.set(pairKey(m.home_code, m.away_code, m.phase), m);
  }

  const changes: SyncChange[] = [];
  const finishedNotifs: Array<{ homeCode: string; awayCode: string; h: number; a: number }> = [];
  const finishedMatchIds: string[] = [];

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

    // Enganchar el partido local (por fd_id, o por par+fase si aún no se vinculó)
    let db = byFdId.get(fx.id) ?? byPair.get(pairKey(homeCode, awayCode, phase));

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
        finishedMatchIds.push(db.id);
      }
    }
  }

  for (const n of finishedNotifs) {
    await sendMatchResultNotifications(supabase, n.homeCode, n.awayCode, n.h, n.a);
  }
  await sendUpcomingMatchNotifications(supabase);

  if (finishedMatchIds.length > 0) {
    await supabase.rpc("fn_refresh_views");
    // Logros de skill (A01-A07) y consistencia (C03): el scope match-settled
    // necesita un evaluador en runtime. Para cada socio que predijo un partido
    // que acaba de cerrar, recomputamos su contexto y desbloqueamos lo que aplique.
    const { data: affected } = await supabase
      .from("prediction")
      .select("user_id")
      .in("match_id", finishedMatchIds);
    const userIds = [...new Set((affected ?? []).map((p) => p.user_id as string))];
    if (userIds.length > 0) await evaluateMatchSettledForUsers(userIds);

    // Logros de posición (P01-P03): dependen del ranking GLOBAL. Tras settle (y los
    // bonus de skill recién otorgados) las posiciones se reordenan para ~todos los
    // socios, no solo los predictores → se reconcilian ranking-wide, al final.
    await reconcilePositionAchievements();
  }

  return NextResponse.json({ ok: true, processed: fixtures.length, changes: changes.length, detail: changes });
}

// ─── Notificaciones ───────────────────────────────────────────────────

// Respeta la preferencia del socio (default ON: solo se excluye si la apagó).
// Misma semántica que prefAllows del push, ahora también para la notif in-app.
function prefOn(prefs: Record<string, boolean> | null | undefined, key: string): boolean {
  return prefs ? prefs[key] !== false : true;
}

type UserPrefRow = { id: string; notification_prefs: Record<string, boolean> | null };

async function sendMatchResultNotifications(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  homeCode: string,
  awayCode: string,
  homeScore: number,
  awayScore: number
) {
  const { data: users } = await supabase
    .from("user")
    .select("id, notification_prefs")
    .is("deleted_at", null);
  if (!users?.length) return;
  // Solo a quienes tienen 'results' activo (antes se insertaba a TODOS).
  const notifs = (users as UserPrefRow[])
    .filter((u) => prefOn(u.notification_prefs, "results"))
    .map((u) => ({
      user_id: u.id,
      type: "match-result",
      title: "Resultado del partido",
      body: `${homeCode.toUpperCase()} ${homeScore} - ${awayScore} ${awayCode.toUpperCase()} · Mirá tus puntos`,
      deep_link: "/app",
    }));
  for (let i = 0; i < notifs.length; i += 100) {
    await supabase.from("notification").insert(notifs.slice(i, i + 100));
  }
  // Push a los suscriptos que tengan 'results' activo (default ON).
  await broadcastPush(
    {
      title: "Resultado del partido",
      body: `${homeCode.toUpperCase()} ${homeScore} - ${awayScore} ${awayCode.toUpperCase()} · Mirá tus puntos`,
      deep_link: "/app",
      tag: "o2-resultados",
    },
    "results",
  );
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
    .is("reminder_sent_at", null) // aún no notificado (dedup robusto, ver el claim abajo)
    // Ventana [now+30, now+60): el recordatorio se manda cuando faltan 30-60 min al
    // kickoff. La dedup ya NO depende de la cadencia del cron (ahora ~2 min) sino del
    // claim atómico sobre reminder_sent_at.
    .gte("kickoff_at", in30min.toISOString())
    .lt("kickoff_at", in60min.toISOString());
  if (!upcomingMatches?.length) return;

  for (const match of upcomingMatches) {
    // Claim atómico: marcamos reminder_sent_at SOLO si seguía null. Si otra corrida
    // del cron ya lo tomó (a ~2 min pueden solaparse), el UPDATE afecta 0 filas y no
    // devuelve nada → lo salteamos. Garantiza exactamente 1 recordatorio por partido,
    // a cualquier cadencia. (Cron usa service_role → puede escribir la columna.)
    const { data: claimed } = await supabase
      .from("match")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", match.id)
      .is("reminder_sent_at", null)
      .select("id");
    if (!claimed?.length) continue;

    const { data: usersWithPred } = await supabase
      .from("prediction")
      .select("user_id")
      .eq("match_id", match.id);
    const predicted = new Set((usersWithPred ?? []).map((p: { user_id: string }) => p.user_id));
    const { data: allUsers } = await supabase
      .from("user")
      .select("id, notification_prefs")
      .is("deleted_at", null);
    // No-predictores QUE además tienen 'matchReminders' activo (antes: todos).
    const without = (allUsers ?? []).filter(
      (u: UserPrefRow) => !predicted.has(u.id) && prefOn(u.notification_prefs, "matchReminders")
    );
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
    // Push solo a los no-predictores con 'matchReminders' activo (default ON).
    await broadcastPush(
      {
        title: "¡Partido en 1 hora!",
        body: `${match.home_code.toUpperCase()} vs ${match.away_code.toUpperCase()} · Cargá tu predicción`,
        deep_link: "/app/prode",
        tag: "o2-recordatorios",
      },
      "matchReminders",
      without.map((u: { id: string }) => u.id),
    );
  }
}

export const GET = handle;
export const POST = handle;
