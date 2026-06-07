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
import { deriveInitials } from "@/lib/auth/initials";

/** URL pública del sitio (para el redirect del mail de confirmación). */
function siteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

// ─── Schemas ──────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
    email: z.string().trim().toLowerCase().email("Email inválido"),
    // Teléfono opcional: si viene, validación liviana (8–30 chars).
    phone: z
      .string()
      .trim()
      .max(30, "Teléfono demasiado largo")
      .optional()
      .or(z.literal("")),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    passwordConfirm: z.string(),
    referralCode: z.string().trim().toUpperCase().max(16).optional().or(z.literal("")),
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
    const msg = error.message.toLowerCase();
    if (error.code === "email_not_confirmed" || msg.includes("not confirmed") || msg.includes("confirm")) {
      return {
        ok: false,
        error: "Confirmá tu email antes de entrar. Revisá tu bandeja (y la carpeta de spam).",
        field: "email",
      };
    }
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
): Promise<ActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    referralCode: formData.get("referralCode"),
    acceptTerms: formData.get("acceptTerms"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Datos inválidos", field: String(issue?.path?.[0] ?? "") };
  }

  const { name, email, phone, password, referralCode } = parsed.data;
  const normalizedPhone = phone && phone.trim() !== "" ? phone.trim() : null;

  // Registro con CONFIRMACIÓN por email (anti-spam). signUp crea la cuenta SIN
  // confirmar y dispara el mail de verificación; la fila en `user` se crea recién
  // al confirmar (en /auth/confirm). Guardamos name/phone en user_metadata para
  // ese momento. NO auto-logueamos: el socio entra después de confirmar.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
      data: { name, phone: normalizedPhone, referralCode: referralCode || undefined },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { ok: false, error: "Ese email ya tiene una cuenta.", field: "email" };
    }
    if (error.status === 429 || msg.includes("rate") || msg.includes("limit")) {
      return { ok: false, error: "Demasiados intentos. Esperá unos minutos y probá de nuevo." };
    }
    if (msg.includes("password")) {
      return { ok: false, error: error.message, field: "password" };
    }
    return { ok: false, error: "No pudimos crear la cuenta. Probá de nuevo." };
  }

  // Supabase ofusca el "email ya registrado": devuelve un user con identities []
  // (para no filtrar qué emails existen). Lo tratamos como cuenta existente.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { ok: false, error: "Ese email ya tiene una cuenta.", field: "email" };
  }

  // Si la confirmación de email NO está activada en Supabase, signUp ya devuelve
  // sesión (cuenta auto-confirmada): creamos la fila y entramos directo. Si SÍ
  // está activada, no hay sesión → mostramos la pantalla "revisá tu email".
  if (data.session && data.user) {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("user")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!existing) {
      await admin.from("user").insert({
        id: data.user.id,
        email,
        name,
        initials: deriveInitials(name),
        phone: normalizedPhone,
      });
    }
    redirect("/app");
  }

  return { ok: true, data: { email } };
}

// ─── Reenviar email de confirmación ───────────────────────────────────

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

export async function resendConfirmationAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const parsed = resendSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, error: "Email inválido" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${siteUrl()}/auth/confirm` },
  });

  if (error) {
    return { ok: false, error: "No pudimos reenviar el mail. Esperá unos minutos." };
  }
  return { ok: true };
}

// ─── Reset password (form de clave nueva tras el link de recovery) ────

const resetSchema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Las contraseñas no coinciden.",
  });

/**
 * Setea la nueva contraseña. La sesión de recovery ya quedó activa (el link del
 * mail pasa por /auth/confirm con type=recovery). updateUser usa esa sesión.
 */
export async function resetPasswordAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Datos inválidos", field: String(issue?.path?.[0] ?? "") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      ok: false,
      error: "No se pudo cambiar la contraseña. El link puede haber vencido — pedí uno nuevo.",
    };
  }
  redirect("/app");
}

// ─── Cambiar contraseña (desde la app, con sesión activa) ─────────────

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.newPassword === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Las contraseñas no coinciden.",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "La nueva contraseña tiene que ser distinta a la actual.",
  });

/**
 * Cambia la contraseña de un socio logueado. Re-autentica con la contraseña
 * actual antes de actualizar (defensa por si la sesión quedó abierta en un
 * dispositivo ajeno). NO redirige: vuelve un ActionResult para mostrar toast.
 */
export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Datos inválidos", field: String(issue?.path?.[0] ?? "") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "No autenticado" };

  // Verificar la contraseña actual re-autenticando.
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (signInErr) {
    return { ok: false, error: "La contraseña actual no es correcta.", field: "currentPassword" };
  }

  const { error: updateErr } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (updateErr) {
    const msg = updateErr.message.toLowerCase();
    if (msg.includes("different") || msg.includes("should be")) {
      return { ok: false, error: "La nueva contraseña tiene que ser distinta a la actual.", field: "newPassword" };
    }
    return { ok: false, error: "No se pudo cambiar la contraseña. Probá de nuevo.", field: "newPassword" };
  }

  return { ok: true };
}

// ─── Sign out ─────────────────────────────────────────────────────────

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
