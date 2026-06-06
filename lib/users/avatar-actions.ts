"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateAvatar(avatarUrl: string) {
  if (!avatarUrl.startsWith("/avatares_O2/") || !avatarUrl.endsWith(".webp")) {
    return { error: "Avatar inválido" as const };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" as const };

  const { error } = await supabase
    .from("user")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { error: "Error al guardar el avatar" as const };
  
  revalidatePath("/app/perfil");
  revalidatePath("/app/perfil/configuracion");
  
  return { success: true };
}
