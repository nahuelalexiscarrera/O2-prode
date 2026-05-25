"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const NotifPrefsSchema = z.object({
  matchReminders: z.boolean(),
  results: z.boolean(),
  socialReactions: z.boolean(),
  weeklyDigest: z.boolean(),
});

export async function updateNotificationPrefs(input: unknown) {
  const parsed = NotifPrefsSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" as const };

  const { error } = await supabase
    .from("user")
    .update({ notification_prefs: parsed.data })
    .eq("id", user.id);

  if (error) return { error: "Error al guardar" as const };
  revalidatePath("/app/perfil/configuracion");
  return { success: true };
}

const VisibilitySchema = z.enum(["public", "private"]);

export async function updateVisibility(input: unknown) {
  const parsed = VisibilitySchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" as const };

  const { error } = await supabase
    .from("user")
    .update({ visibility: parsed.data })
    .eq("id", user.id);

  if (error) return { error: "Error al guardar" as const };
  return { success: true };
}
