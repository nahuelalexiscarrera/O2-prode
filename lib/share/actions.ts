"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  template: z.enum(["summary", "position", "match", "achievement"]),
  contextId: z.string().uuid().optional(),
  body: z.string().trim().min(1).max(280),
});

export type ShareToWallResult = { ok: true } | { ok: false; error: string };

/**
 * Publica el share card seleccionado en el muro. Crea un post cuyo image_url
 * apunta al endpoint de share (PNG generado server-side). Es una URL relativa
 * para que se renderice sin config de dominios externos.
 */
export async function shareToWall(input: {
  template: "summary" | "position" | "match" | "achievement";
  contextId?: string;
  body: string;
}): Promise<ShareToWallResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const params = new URLSearchParams({ format: "square" });
  if (parsed.data.contextId) params.set("contextId", parsed.data.contextId);
  const imageUrl = `/api/share/${parsed.data.template}/${user.id}?${params.toString()}`;

  const { error } = await supabase.from("post").insert({
    user_id: user.id,
    body: parsed.data.body,
    image_url: imageUrl,
    image_width: 1080,
    image_height: 1080,
  });
  if (error) return { ok: false, error: "No se pudo publicar en el muro." };

  revalidateTag("feed-recientes");
  return { ok: true };
}
