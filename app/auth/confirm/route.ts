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
import { provisionUser } from "@/lib/auth/provision";

/**
 * Crea la fila en `user` la primera vez que el socio confirma (idempotente).
 * Delega en provisionUser (misma lógica que el registro sin confirmación) para
 * que ambos flujos creen la fila + referidos + código de forma idéntica.
 */
async function ensureUserRow(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const meta = (user.user_metadata ?? {}) as {
    name?: string;
    phone?: string | null;
    referralCode?: string;
  };

  await provisionUser({
    userId: user.id,
    email: user.email ?? null,
    name: meta.name ?? "",
    phone: meta.phone ?? null,
    referralCode: meta.referralCode ?? null,
  });
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
