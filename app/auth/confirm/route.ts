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
  // upsert idempotente: si dos requests concurrentes pasan el SELECT de arriba
  // (TOCTOU: doble click, prefetch, escáner de links del mail), el segundo no
  // rompe ni pisa la fila (ignoreDuplicates). Chequeamos el error para no seguir
  // de largo como "éxito" si el alta realmente falló.
  const { error: insertErr } = await admin.from("user").upsert(
    {
      id: user.id,
      email: user.email,
      name,
      initials: deriveInitials(name),
      phone: meta.phone ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (insertErr) {
    console.error("[auth/confirm] no se pudo crear la fila user", insertErr);
    return;
  }

  // Referidos: linkea al referidor (si vino uno) y genera el código propio.
  // Graceful: si las columnas referral_code/referred_by no existen todavía
  // (antes de la migración), los updates fallan en silencio y no rompen el registro.

  // 1) referred_by va en su PROPIO update: no tiene índice único, así que una
  //    colisión del referral_code (abajo) no debe arrastrar este link (B1).
  if (meta.referralCode) {
    const { data: referrer } = await admin
      .from("user")
      .select("id")
      .eq("referral_code", meta.referralCode.toUpperCase())
      .maybeSingle();
    if (referrer && referrer.id !== user.id) {
      await admin.from("user").update({ referred_by: referrer.id }).eq("id", user.id);
    }
  }

  // 2) referral_code propio con REINTENTO ante colisión del índice único
  //    idx_user_referral_code (antes: un solo intento → colisión = socio sin código,
  //    rompía el flujo de referidos para él). 5 intentos hacen la colisión
  //    despreciable (espacio 16^6).
  const genCode = () => crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await admin
      .from("user")
      .update({ referral_code: genCode() })
      .eq("id", user.id)
      .is("referral_code", null); // nunca pisar un código ya emitido (re-entrada concurrente)
    if (!error) break;
    // 23505 = unique_violation → reintentar con otro código. Cualquier otro error
    // (p.ej. 42703 columna inexistente antes de la migración) → cortar, pero
    // logueando para tener visibilidad (antes el break era silencioso).
    if ((error as { code?: string }).code !== "23505") {
      console.error("[auth/confirm] no se pudo asignar referral_code", error);
      break;
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  // Solo rutas internas. Resolvemos `next` contra el propio origin y exigimos que
  // el origin resultante coincida. Una blacklist de prefijos (//, /\) se podía
  // evadir con control chars (%09/%0A/%0D): el navegador los strippea y convierte
  // "/\t//evil" en "//evil" (host externo). new URL() normaliza igual que el
  // navegador, así que candidate.origin === origin SOLO para rutas internas reales.
  const origin = new URL(request.url).origin;
  let next = "/app";
  if (nextParam) {
    try {
      const candidate = new URL(nextParam, origin);
      if (candidate.origin === origin && candidate.pathname.startsWith("/")) {
        next = candidate.pathname + candidate.search + candidate.hash;
      }
    } catch {
      /* nextParam inválido → queda /app */
    }
  }

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
