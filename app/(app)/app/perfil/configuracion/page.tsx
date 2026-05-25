import { redirect } from "next/navigation";
import { getMySettings } from "@/lib/users/queries";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { SettingsForm } from "@/components/features/SettingsForm";

export default async function ConfiguracionPage() {
  const settings = await getMySettings();
  if (!settings) redirect("/login");

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
      />
    </div>
  );
}
