/**
 * O2 PRODE — Onboarding (primer ingreso con Google OAuth).
 *
 * Guarda nombre / teléfono / sucursal del socio recién registrado. Usa el client
 * NORMAL (RLS) y delega en la función fn_complete_onboarding (SECURITY DEFINER,
 * acotada a auth.uid() + branch IS NULL). NO usa service_role ni amplía grants.
 */

"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

const schema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre").max(80),
  phone: z.string().trim().max(30, "Teléfono demasiado largo").optional().or(z.literal("")),
  branch: z.enum(["rufina", "cofico"], {
    errorMap: () => ({ message: "Elegí tu sucursal." }),
  }),
});

export async function completeOnboardingAction(
  _prev: unknown,
  formData: FormData
): Promise<OnboardingResult> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    branch: formData.get("branch"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Datos inválidos",
      field: String(issue?.path?.[0] ?? ""),
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Sesión no encontrada. Volvé a iniciar sesión." };
    }

    // Client NORMAL → la función SECURITY DEFINER valida auth.uid(), branch y el
    // "un solo uso" (branch IS NULL) del lado de la DB.
    const { error } = await supabase.rpc("fn_complete_onboarding", {
      p_name: parsed.data.name,
      p_phone: parsed.data.phone ?? "",
      p_branch: parsed.data.branch,
    });

    if (error) {
      // Si el onboarding ya estaba completo, no es un error para el socio: entra.
      if (error.message.toLowerCase().includes("ya completado")) {
        redirect("/app");
      }
      console.error("[completeOnboardingAction] rpc error:", error.message);
      return { ok: false, error: "No se pudo guardar tu perfil. Probá de nuevo." };
    }

    redirect("/app");
  } catch (e) {
    const err = e as { digest?: string };
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    console.error("[completeOnboardingAction]", e);
    return { ok: false, error: "Error de conexión. Intentá de nuevo." };
  }
}
