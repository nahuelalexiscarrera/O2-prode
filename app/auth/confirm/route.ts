/**
 * O2 PRODE — Confirmación de email (Server-Side Auth).
 *
 * El link del mail apunta acá con ?token_hash=...&type=signup. Verificamos el
 * token (verifyOtp, que NO depende del code-verifier → funciona aunque el mail
 * se abra en otro navegador/dispositivo), creamos la fila en `user` si falta y
 * mandamos a /app. Si el token es inválido o venció, vuelve a /login.
 *
 * Requiere en Supabase: Auth → "Confirm email" activado, Site URL configurada y
 * el template "Confirm signup" apuntando a {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
 */

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveInitials } from "@/lib/auth/initials";

/** Crea la fila en `user` la primera vez que el socio confirma (idempotente). */
async function ensureUserRow(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("user")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return;

  const meta = (user.user_metadata ?? {}) as {
    name?: string;
    phone?: string | null;
    referralCode?: string;
  };
  const name = (meta.name && meta.name.trim()) || user.email?.split("@")[0] || "Socio";
  await admin.from("user").insert({
    id: user.id,
    email: user.email,
    name,
    initials: deriveInitials(name),
    phone: meta.phone ?? null,
  });

  // Referidos: genera el código propio + linkea al referidor si vino uno.
  // Graceful: si las columnas referral_code/referred_by no existen todavía
  // (antes de la migración), el update falla en silencio y no rompe el registro.
  const updates: Record<string, unknown> = {
    referral_code: crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase(),
  };
  if (meta.referralCode) {
    const { data: referrer } = await admin
      .from("user")
      .select("id")
      .eq("referral_code", meta.referralCode.toUpperCase())
      .maybeSingle();
    if (referrer && referrer.id !== user.id) updates.referred_by = referrer.id;
  }
  await admin.from("user").update(updates).eq("id", user.id);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  // Solo rutas internas: rechazar protocol-relative (//host) y backslash (/\host)
  // que el navegador interpreta como host externo (open redirect / phishing).
  const isSafeNext =
    !!nextParam &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.startsWith("/\\");
  const next = isSafeNext ? nextParam : "/app";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      try {
        await ensureUserRow();
      } catch (e) {
        console.error("[auth/confirm] ensureUserRow falló", e);
      }
      redirect(next);
    }
  }

  redirect("/login?error=confirm");
}
