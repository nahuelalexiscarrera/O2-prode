/**
 * POST /api/cron/refresh-views
 *
 * Refresca las materialized views mv_user_summary y mv_ranking_global.
 * Ejecutado cada 5 minutos vía Vercel Cron.
 * Protegido por Authorization: Bearer <CRON_SECRET>.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authOk(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("fn_refresh_views");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, refreshed: ["mv_user_summary", "mv_ranking_global"] });
}

// Vercel Cron dispara GET; mantenemos POST para invocación manual.
export const GET = handle;
export const POST = handle;
