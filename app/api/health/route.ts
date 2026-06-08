import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fingerprint NO sensible de una credencial pública (anon key es "publishable").
// Muestra prefijo + sufijo + longitud para poder comparar valores sin exponer el medio.
function fp(s: string | undefined): string {
  if (!s) return "MISSING";
  if (s.length <= 28) return `${s.slice(0, 8)}…(len=${s.length})`;
  return `${s.slice(0, 18)}…${s.slice(-6)} (len=${s.length})`;
}

export async function GET() {
  // RUNTIME (bracket): se lee de las env vars de Vercel en cada request.
  const urlRuntime = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const keyRuntime = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  // BUILD (dot): Next.js hornea este valor en build-time.
  const urlBuild = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const keyBuild = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!urlRuntime,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!keyRuntime,
    SUPABASE_SERVICE_ROLE_KEY: !!serviceKey,
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    CRON_SECRET: !!process.env.CRON_SECRET,
    VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
  };
  const missingEnv = Object.entries(envCheck).filter(([, v]) => !v).map(([k]) => k);

  // Self-test: pegar a /auth/v1/health con el key de runtime y con el de build.
  async function testKey(url: string | undefined, key: string | undefined) {
    if (!url || !key) return { ok: false, status: 0, error: "missing url/key" };
    try {
      const r = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      });
      return { ok: r.ok, status: r.status, error: r.ok ? null : `HTTP ${r.status}` };
    } catch (e) {
      return { ok: false, status: 0, error: (e as Error).message };
    }
  }

  const [runtimeTest, buildTest] = await Promise.all([
    testKey(urlRuntime, keyRuntime),
    testKey(urlBuild, keyBuild),
  ]);

  const supabaseOk = runtimeTest.ok || buildTest.ok;
  const allOk = missingEnv.length === 0 && supabaseOk;

  return NextResponse.json(
    {
      ok: allOk,
      version: "1.1.0",
      service: "o2-prode",
      timestamp: new Date().toISOString(),
      env: envCheck,
      missing_env: missingEnv,
      fingerprints: {
        url_runtime: urlRuntime ?? "MISSING",
        url_build: urlBuild ?? "MISSING",
        key_runtime: fp(keyRuntime),
        key_build: fp(keyBuild),
        key_match: keyRuntime === keyBuild,
      },
      supabase: {
        ok: supabaseOk,
        runtime_key_test: runtimeTest,
        build_key_test: buildTest,
      },
    },
    { status: allOk ? 200 : 503 }
  );
}
