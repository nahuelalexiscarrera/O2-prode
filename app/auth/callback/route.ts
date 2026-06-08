/**
 * O2 PRODE — OAuth callback (Google).
 *
 * Google redirige acá con ?code=. Flujo PKCE server-side:
 *  1. exchangeCodeForSession(code) → establece la sesión (lee el code_verifier
 *     de la cookie y setea las cookies de sesión en la respuesta).
 *  2. provisionUser() → crea la fila `user` si no existe (idempotente; reusa el
 *     mismo helper que el registro por email). El nombre viene de Google.
 *  3. Detección de primer ingreso: si falta `branch` → /onboarding; si no → /app.
 *
 * Aislado del flujo de email (/auth/confirm usa token_hash + verifyOtp). No toca
 * el middleware ni ninguna config existente.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionUser } from "@/lib/auth/provision";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDesc = searchParams.get("error_description");

  // El provider (Google/Supabase) devolvió un error — p.ej. GoTrue falló al CREAR
  // el usuario nuevo (un trigger/hook sobre auth.users). Logueamos y propagamos el
  // detalle real para diagnóstico (antes se descartaba y se veía un genérico).
  if (oauthError) {
    console.error("[oauth callback] provider error:", oauthError, "·", oauthErrorDesc);
    const detail = oauthErrorDesc ?? oauthError;
    return NextResponse.redirect(`${origin}/login?error=oauth&detail=${encodeURIComponent(detail)}`);
  }
  if (!code) {
    console.error("[oauth callback] missing ?code");
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[oauth callback] exchangeCodeForSession:", error.message);
    return NextResponse.redirect(`${origin}/login?error=oauth&detail=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  // Provisionar la fila `user` (idempotente). Nombre desde Google si está.
  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  try {
    await provisionUser({
      userId: user.id,
      email: user.email ?? null,
      name: meta.full_name || meta.name || "",
      phone: null,
      referralCode: null,
    });
  } catch {
    // No bloqueamos el login si el provisioning falla puntualmente; el
    // onboarding/lectura de abajo decide igual el destino.
  }

  // Detección de primer ingreso: ¿ya eligió sucursal?
  const { data: profile } = await supabase
    .from("user")
    .select("branch")
    .eq("id", user.id)
    .maybeSingle();
  const branch = (profile as { branch?: string | null } | null)?.branch ?? null;

  return NextResponse.redirect(`${origin}/${branch ? "app" : "onboarding"}`);
}
