/**
 * GET /api/diagnostics
 *
 * Endpoint temporal de diagnóstico para destrabar el deploy.
 * Prueba cada query / tabla / config que /app necesita para renderizar.
 * Devuelve JSON con el resultado de cada check (sin throw).
 *
 * No requiere auth. No expone datos sensibles (solo conteos y mensajes de error).
 * Borrar este archivo una vez resuelto el problema de la beta.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNextMatch } from "@/lib/matches/queries";
import { getFeedRecientes } from "@/lib/social/queries";
import { getMyProfile } from "@/lib/users/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = {
  name: string;
  ok: boolean;
  detail?: unknown;
  error?: { code?: string; message: string; hint?: string };
};

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [];

  // ─── 1. Env vars básicas ─────────────────────────────────────────────
  const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  checks.push({
    name: "env: NEXT_PUBLIC_SUPABASE_URL",
    ok: Boolean(envSupabaseUrl),
    detail: envSupabaseUrl ? `${envSupabaseUrl.slice(0, 40)}…` : "MISSING",
  });
  checks.push({
    name: "env: NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ok: Boolean(envAnonKey),
    detail: envAnonKey ? `${envAnonKey.slice(0, 12)}…` : "MISSING",
  });
  checks.push({
    name: "env: SUPABASE_SERVICE_ROLE_KEY",
    ok: Boolean(envServiceRole),
    detail: envServiceRole ? `${envServiceRole.slice(0, 12)}…` : "MISSING",
  });
  checks.push({
    name: "env: NEXT_PUBLIC_APP_URL",
    ok: Boolean(envAppUrl),
    detail: envAppUrl ?? "MISSING",
  });

  // Sin las envs básicas no tiene sentido seguir
  if (!envSupabaseUrl || !envServiceRole) {
    checks.push({
      name: "abort",
      ok: false,
      error: { message: "Faltan envs críticas; resto de checks omitidos." },
    });
    return checks;
  }

  // ─── 2. Tablas existen + counts (vía service role) ───────────────────
  const admin = createAdminClient();

  const tables = [
    "tournament",
    "groups",
    "team",
    "match",
    "achievement_catalog",
    "invite_code",
    "user",
    "post",
    "comment",
    "reaction",
    "prediction",
    "notification",
  ] as const;

  for (const t of tables) {
    const { count, error } = await admin
      .from(t)
      .select("*", { count: "exact", head: true });
    if (error) {
      checks.push({
        name: `table: ${t}`,
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          hint: error.hint ?? undefined,
        },
      });
    } else {
      checks.push({
        name: `table: ${t}`,
        ok: true,
        detail: `${count ?? 0} rows`,
      });
    }
  }

  // ─── 3. Sesión actual + lookup en table user ─────────────────────────
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr) {
    checks.push({
      name: "auth: getUser",
      ok: false,
      error: { message: authErr.message },
    });
  } else if (!authUser) {
    checks.push({
      name: "auth: getUser",
      ok: true,
      detail: "no session (no logueado)",
    });
  } else {
    checks.push({
      name: "auth: getUser",
      ok: true,
      detail: `user.id=${authUser.id.slice(0, 8)}…`,
    });

    // ¿Hay fila correspondiente en table user?
    const { data: userRow, error: userRowErr } = await admin
      .from("user")
      .select("id, email, name, initials")
      .eq("id", authUser.id)
      .maybeSingle();

    if (userRowErr) {
      checks.push({
        name: "table user: row del logueado",
        ok: false,
        error: { code: userRowErr.code, message: userRowErr.message },
      });
    } else if (!userRow) {
      checks.push({
        name: "table user: row del logueado",
        ok: false,
        error: {
          message:
            "FALTANTE — hay session pero NO existe fila en table user. El registro previo no completó el insert.",
        },
      });
    } else {
      checks.push({
        name: "table user: row del logueado",
        ok: true,
        detail: `${userRow.email} · ${userRow.name}`,
      });
    }
  }

  // ─── 4. Las queries que HomePage llama (con server client + RLS) ─────
  // Cada una se ejecuta independiente para identificar cuál revienta.

  try {
    const profile = await getMyProfile();
    checks.push({
      name: "query: getMyProfile()",
      ok: true,
      detail: profile
        ? `name=${profile.name} pts=${profile.total_points} pos=${profile.position}`
        : "null (sin profile)",
    });
  } catch (err) {
    checks.push({
      name: "query: getMyProfile()",
      ok: false,
      error: {
        message: err instanceof Error ? err.message : String(err),
      },
    });
  }

  try {
    const next = await getNextMatch();
    checks.push({
      name: "query: getNextMatch()",
      ok: true,
      detail: next
        ? `${next.home_code} vs ${next.away_code} @ ${next.kickoff_at}`
        : "null (sin próximo partido)",
    });
  } catch (err) {
    checks.push({
      name: "query: getNextMatch()",
      ok: false,
      error: {
        message: err instanceof Error ? err.message : String(err),
      },
    });
  }

  try {
    const feed = await getFeedRecientes({ limit: 3 });
    checks.push({
      name: "query: getFeedRecientes(limit=3)",
      ok: true,
      detail: `${feed.length} posts`,
    });
  } catch (err) {
    checks.push({
      name: "query: getFeedRecientes(limit=3)",
      ok: false,
      error: {
        message: err instanceof Error ? err.message : String(err),
      },
    });
  }

  return checks;
}

async function handle() {
  try {
    const checks = await runChecks();
    const summary = {
      total: checks.length,
      passing: checks.filter((c) => c.ok).length,
      failing: checks.filter((c) => !c.ok).length,
    };
    return NextResponse.json({ summary, checks }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        fatal: true,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
