/**
 * O2 PRODE — Onboarding (primer ingreso con Google OAuth).
 *
 * Server component: hace el guard de sesión y de "primer ingreso". El callback
 * OAuth redirige acá cuando falta `branch`. Si no hay sesión → login; si ya
 * completó el onboarding → app. El nombre se prellena con el de Google.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = { title: "Completá tu perfil · O2 PRODE" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user")
    .select("name, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  // Ya completó el onboarding → no lo repetimos.
  if ((profile as { onboarding_completed_at?: string | null } | null)?.onboarding_completed_at) {
    redirect("/app");
  }

  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const defaultName =
    (profile as { name?: string } | null)?.name || meta.full_name || meta.name || "";

  return <OnboardingForm defaultName={defaultName} />;
}
