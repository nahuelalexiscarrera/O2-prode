import { redirect } from "next/navigation";
import { getMySettings, getMyProfile } from "@/lib/users/queries";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { SettingsForm } from "@/components/features/SettingsForm";

export default async function ConfiguracionPage() {
  const [settings, profile] = await Promise.all([getMySettings(), getMyProfile()]);
  if (!settings || !profile) redirect("/login");

  const initialPrefs = settings.notification_prefs ?? {
    matchReminders: true,
    results: true,
    socialReactions: false,
    weeklyDigest: false,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ScreenHeader title="Configuración" backHref="/app/perfil" />
      <SettingsForm
        email={settings.email}
        initialPrefs={initialPrefs}
        initialVisibility={settings.visibility}
        avatarUrl={profile.avatar_url}
        name={profile.name}
        initials={profile.initials}
      />
    </div>
  );
}
