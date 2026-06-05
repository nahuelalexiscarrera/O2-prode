/**
 * O2 PRODE — Users · Server Queries
 */

import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  id: string;
  name: string;
  initials: string;
  avatar_url: string | null;
  level: string;
  total_points: number;
  position: number;
};

export type UserSettings = {
  email: string;
  notification_prefs: {
    matchReminders: boolean;
    results: boolean;
    socialReactions: boolean;
    weeklyDigest: boolean;
  } | null;
  visibility: "public" | "private";
};

export async function getMySettings(): Promise<UserSettings | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user")
    .select("notification_prefs, visibility")
    .eq("id", user.id)
    .single();
  if (error) return null;

  return {
    email: user.email ?? "",
    notification_prefs: data.notification_prefs as UserSettings["notification_prefs"],
    visibility: ((data.visibility as string) === "private" ? "private" : "public") as
      | "public"
      | "private",
  };
}

export async function getMyProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user")
    .select("id, name, initials, avatar_url, level, total_points, position")
    .eq("id", user.id)
    .single();
  if (error) return null;
  return data as UserProfile;
}

/** ¿El usuario actual es admin/superusuario? Falla a `false` (ej. si la columna
 *  is_admin todavía no existe en la DB), así nunca rompe el render. */
export async function getIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data, error } = await supabase
      .from("user")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (error) return false;
    return Boolean((data as { is_admin?: boolean } | null)?.is_admin);
  } catch {
    return false;
  }
}

/** Cantidad de notificaciones no leídas del usuario actual. */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;
    const { count } = await supabase
      .from("notification")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Código de referido del usuario + cuántos amigos se sumaron con él.
 *  Devuelve null si las columnas de referido todavía no existen (pre-migración). */
export async function getMyReferral(): Promise<{ code: string; friends: number } | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user")
      .select("referral_code")
      .eq("id", user.id)
      .maybeSingle();
    const code = (data as { referral_code?: string | null } | null)?.referral_code;
    if (error || !code) return null;

    const { count } = await supabase
      .from("user")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", user.id)
      .is("deleted_at", null);
    return { code, friends: count ?? 0 };
  } catch {
    return null;
  }
}

/** Perfil público de otro socio (para ver desde el muro / ranking). */
export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user")
    .select("id, name, initials, avatar_url, level, total_points, position")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as UserProfile;
}
