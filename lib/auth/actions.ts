/**
 * O2 PRODE — Auth server actions
 *
 * Server actions para login, registro (con invite code) y logout.
 * El registro consume un invite_code de la tabla `invite_code` y crea
 * la fila correspondiente en la tabla `user`.
 *
 * Validación: Zod (regla CLAUDE.md §4).
 */

"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Schemas ──────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
    email: z.string().trim().toLowerCase().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    passwordConfirm: z.string(),
    inviteCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{3,32}$/, "Código inválido"),
    acceptTerms: z.literal("on", {
      errorMap: () => ({ message: "Tenés que aceptar los términos." }),
    }),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Las contraseñas no coinciden.",
  });

const validateInviteSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,32}$/, "Formato de código inválido"),
});

// ─── Helpers ──────────────────────────────────────────────────────────

/** "Juan Pérez" → "JP", "Maria" → "MA", "Ana Maria Lopez" → "AL" */
function deriveInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const first = parts[0]!.charAt(0);
  const last = parts[parts.length - 1]!.charAt(0);
  return (first + last).toUpperCase();
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string };

// ─── Sign in ──────────────────────────────────────────────────────────

export async function signInAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Datos inválidos", field: String(issue?.path?.[0] ?? "") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Mensaje neutro para no filtrar si el email existe o no.
    return { ok: false, error: "Email o contraseña incorrectos." };
  }

  redirect("/app");
}

// ─── Validate invite (paso 1 del register) ────────────────────────────

export async function validateInviteAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult<{ inviteCode: string }>> {
  const parsed = validateInviteSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Código inválido" };
  }

  const admin = createAdminClient();
  const { data: invite, error } = await admin
    .from("invite_code")
    .select("code, used, expires_at")
    .eq("code", parsed.data.inviteCode)
    .maybeSingle();

  if (error) return { ok: false, error: "No pudimos validar el código. Probá de nuevo." };
  if (!invite) return { ok: false, error: "Ese código no existe." };
  if (invite.used) return { ok: false, error: "Ese código ya fue usado." };
  if (new Date(invite.expires_at) < new Date()) {
    return { ok: false, error: "Ese código está vencido." };
  }

  return { ok: true, data: { inviteCode: invite.code } };
}

// ─── Sign up (paso 2 del register) ────────────────────────────────────

export async function signUpAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    inviteCode: formData.get("inviteCode"),
    acceptTerms: formData.get("acceptTerms"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Datos inválidos", field: String(issue?.path?.[0] ?? "") };
  }

  const { name, email, password, inviteCode } = parsed.data;
  const admin = createAdminClient();

  // 1) Re-validar el invite code server-side antes de tocar auth.users
  const { data: invite, error: inviteErr } = await admin
    .from("invite_code")
    .select("code, used, expires_at")
    .eq("code", inviteCode)
    .maybeSingle();

  if (inviteErr || !invite) return { ok: false, error: "Código de invitación inválido.", field: "inviteCode" };
  if (invite.used) return { ok: false, error: "Ese código ya fue usado.", field: "inviteCode" };
  if (new Date(invite.expires_at) < new Date()) {
    return { ok: false, error: "Ese código está vencido.", field: "inviteCode" };
  }

  // 2) Crear la cuenta en auth.users (vía server client así setea cookie)
  const supabase = await createClient();
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpErr) {
    console.error("[signUpAction] supabase.auth.signUp falló", {
      code: signUpErr.code,
      status: signUpErr.status,
      message: signUpErr.message,
    });
    const msg = signUpErr.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { ok: false, error: "Ese email ya tiene una cuenta.", field: "email" };
    }
    if (msg.includes("password")) {
      return { ok: false, error: signUpErr.message, field: "password" };
    }
    if (msg.includes("rate") || msg.includes("limit")) {
      return { ok: false, error: "Demasiados intentos. Esperá un momento y probá de nuevo." };
    }
    return { ok: false, error: `Auth error: ${signUpErr.message}` };
  }

  // Supabase obfusca emails duplicados devolviendo user con identities vacío.
  if (signUpData.user && (signUpData.user.identities?.length ?? 0) === 0) {
    console.warn("[signUpAction] email duplicado (identities vacío)", { email });
    return { ok: false, error: "Ese email ya tiene una cuenta.", field: "email" };
  }

  if (!signUpData.user) {
    console.error("[signUpAction] signUp ok pero sin user", { signUpData });
    return { ok: false, error: "No pudimos crear la cuenta (sin user devuelto)." };
  }

  const newUserId = signUpData.user.id;
  const needsEmailConfirm = !signUpData.session;

  // 3) Insertar fila en `user` (bypaseando RLS con admin)
  const { error: insertErr } = await admin.from("user").insert({
    id: newUserId,
    email,
    name,
    initials: deriveInitials(name),
    invite_code_used: inviteCode,
  });

  if (insertErr) {
    console.error("[signUpAction] insert en table user falló", {
      code: insertErr.code,
      message: insertErr.message,
      details: insertErr.details,
      hint: insertErr.hint,
    });
    // Rollback de la cuenta de auth si falla el insert
    await admin.auth.admin.deleteUser(newUserId);
    // Surface el código de Postgres para diagnosticar
    return {
      ok: false,
      error: `No pudimos completar el registro. (DB ${insertErr.code ?? "?"}: ${insertErr.message})`,
    };
  }

  // 4) Marcar el invite como usado
  const { error: updateInviteErr } = await admin
    .from("invite_code")
    .update({ used: true, used_by: newUserId })
    .eq("code", inviteCode);

  if (updateInviteErr) {
    console.error("[signUpAction] update invite_code falló (no fatal)", updateInviteErr);
  }

  // Si Supabase tiene email confirmation activado, no hay session todavía.
  if (needsEmailConfirm) {
    redirect("/login?confirm=1");
  }

  redirect("/app");
}

// ─── Sign out ─────────────────────────────────────────────────────────

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
