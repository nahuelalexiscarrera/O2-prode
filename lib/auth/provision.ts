/**
 * O2 PRODE — Provisioning de la fila `user` (idempotente).
 *
 * SIN "use server": es un helper interno (lo importan server actions y el route
 * de /auth/confirm), NO un endpoint RPC.
 *
 * Unifica la creación de la fila `user` + el linkeo de referidos + la generación
 * del código de referido propio. Se llama desde DOS flujos que deben comportarse
 * idéntico:
 *   - signUpAction (confirmación de email DESACTIVADA → signUp ya da sesión)
 *   - /auth/confirm (confirmación ACTIVADA → tras verificar el token)
 * Antes la lógica de referidos vivía solo en /auth/confirm; con la confirmación
 * apagada se perdían los referidos. Esta función cierra esa brecha.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { deriveInitials } from "@/lib/auth/initials";

export interface ProvisionUserInput {
  userId: string;
  email: string | null;
  name: string;
  phone?: string | null;
  referralCode?: string | null;
}

export async function provisionUser(input: ProvisionUserInput): Promise<void> {
  const admin = createAdminClient();
  const name = input.name?.trim() || input.email?.split("@")[0] || "Socio";

  // upsert idempotente: dos requests concurrentes (doble click, prefetch, escáner
  // de links del mail) no rompen ni pisan la fila (ignoreDuplicates).
  const { error: insertErr } = await admin.from("user").upsert(
    {
      id: input.userId,
      email: input.email,
      name,
      initials: deriveInitials(name),
      phone: input.phone ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (insertErr) {
    console.error("[provisionUser] no se pudo crear la fila user", insertErr);
    return;
  }

  // Referidos: linkea al referidor (si vino uno) y genera el código propio.
  // Graceful: si las columnas referral_code/referred_by no existen todavía,
  // los updates fallan en silencio y no rompen el registro.

  // 1) referred_by en su PROPIO update (sin índice único → una colisión del
  //    referral_code no debe arrastrar este link).
  if (input.referralCode) {
    const { data: referrer } = await admin
      .from("user")
      .select("id")
      .eq("referral_code", input.referralCode.toUpperCase())
      .maybeSingle();
    if (referrer && referrer.id !== input.userId) {
      await admin.from("user").update({ referred_by: referrer.id }).eq("id", input.userId);
    }
  }

  // 2) referral_code propio con REINTENTO ante colisión del índice único
  //    (espacio 16^6 → 5 intentos hacen la colisión despreciable).
  const genCode = () => crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await admin
      .from("user")
      .update({ referral_code: genCode() })
      .eq("id", input.userId)
      .is("referral_code", null); // nunca pisar un código ya emitido
    if (!error) break;
    // 23505 = unique_violation → reintentar. Otro error (ej. columna inexistente
    // antes de la migración) → cortar logueando.
    if ((error as { code?: string }).code !== "23505") {
      console.error("[provisionUser] no se pudo asignar referral_code", error);
      break;
    }
  }
}
