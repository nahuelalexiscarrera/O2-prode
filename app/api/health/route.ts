import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseKey,
    SUPABASE_SERVICE_ROLE_KEY: !!serviceKey,
    NEXT_PUBLIC_APP_URL: !!appUrl,
    CRON_SECRET: !!process.env.CRON_SECRET,
    VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
  };

  const missingEnv = Object.entries(envCheck)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  let supabaseOk = false;
  let supabaseError: string | null = null;

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        signal: AbortSignal.timeout(5000),
      });
      supabaseOk = res.ok;
      if (!res.ok) supabaseError = `HTTP ${res.status}`;
    } catch (e) {
      supabaseError = (e as Error).message;
    }
  } else {
    supabaseError = "Missing env vars";
  }

  const allOk = missingEnv.length === 0 && supabaseOk;

  return NextResponse.json(
    {
      ok: allOk,
      version: "1.0.0",
      service: "o2-prode",
      timestamp: new Date().toISOString(),
      env: envCheck,
      missing_env: missingEnv,
      supabase: { ok: supabaseOk, error: supabaseError },
    },
    { status: allOk ? 200 : 503 }
  );
}
