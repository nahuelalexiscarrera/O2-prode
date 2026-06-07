"use server";

import { z } from "zod";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evalSocialAchievements } from "@/lib/social/actions";

// contextId puede ser un UUID (match) o la clave de catálogo de un logro ("A01").
// Por eso NO se valida como uuid acá; el insert en columnas UUID se guarda como
// null si no es uuid (ver recordShareAction).
const schema = z.object({
  template: z.enum(["summary", "position", "match", "achievement"]),
  contextId: z.string().trim().min(1).max(64).optional(),
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

// ─── Registrar un share (para el logro "Embajador") ───────────────────

const recordSchema = z.object({
  template: z.enum(["summary", "position", "match", "achievement"]),
  channel: z.enum(["instagram", "whatsapp", "download", "more"]),
  contextId: z.string().trim().min(1).max(64).optional(),
});

/**
 * Registra que el usuario compartió un viral share. Inserta en share_intent
 * (service role: la tabla tiene RLS sin policy) y re-evalúa los logros sociales
 * → desbloquea S03 "Embajador" al 5to share. Fire-and-forget desde el cliente.
 */
export async function recordShareAction(input: {
  template: "summary" | "position" | "match" | "achievement";
  channel: "instagram" | "whatsapp" | "download" | "more";
  contextId?: string;
}): Promise<{ ok: boolean }> {
  const parsed = recordSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // share_intent.context_id es UUID: si el contextId es la clave de un logro
  // (ej. "A01"), guardamos null para no romper el tipo (el share igual cuenta).
  const ctx = parsed.data.contextId;
  const contextUuid = ctx && z.string().uuid().safeParse(ctx).success ? ctx : null;

  const admin = createAdminClient();
  const { error } = await admin.from("share_intent").insert({
    user_id: user.id,
    template: parsed.data.template,
    channel: parsed.data.channel,
    context_id: contextUuid,
  });
  if (error) return { ok: false };

  await evalSocialAchievements(user.id);
  return { ok: true };
}
