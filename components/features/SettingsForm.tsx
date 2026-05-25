"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/Switch";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { updateNotificationPrefs, updateVisibility } from "@/lib/users/actions";
import { PushToggle } from "@/components/features/PushToggle";
import { cn } from "@/lib/utils/cn";

interface NotifPrefs {
  matchReminders: boolean;
  results: boolean;
  socialReactions: boolean;
  weeklyDigest: boolean;
}

interface SettingsFormProps {
  email: string;
  initialPrefs: NotifPrefs;
  initialVisibility: "public" | "private";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-4 pt-5 pb-1 block">
      {children}
    </span>
  );
}

function SettingsRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border last:border-b-0">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-3">
        <span className="text-body-sm text-text font-medium">{label}</span>
        {description && (
          <span className="text-[11px] text-text-muted">{description}</span>
        )}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function StaticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border last:border-b-0">
      <span className="text-body-sm text-text">{label}</span>
      <span className="text-body-sm text-text-muted">{value}</span>
    </div>
  );
}

export function SettingsForm({ email, initialPrefs, initialVisibility }: SettingsFormProps) {
  const [prefs, setPrefs] = useState<NotifPrefs>(initialPrefs);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function handlePrefChange(key: keyof NotifPrefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    startTransition(async () => {
      const result = await updateNotificationPrefs(next);
      if ("error" in result) {
        toast({ variant: "error", message: String(result.error) });
        setPrefs(prefs); // revert
      }
    });
  }

  function handleVisibilityChange(isPublic: boolean) {
    const next = isPublic ? "public" : ("private" as const);
    setVisibility(next);
    startTransition(async () => {
      const result = await updateVisibility(next);
      if ("error" in result) {
        toast({ variant: "error", message: String(result.error) });
        setVisibility(visibility); // revert
      }
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {/* Account */}
      <SectionLabel>Cuenta</SectionLabel>
      <div className="mx-4 bg-card rounded-xl border border-border overflow-hidden">
        <StaticRow label="Email" value={email} />
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <span className="text-body-sm text-text">Cambiar contraseña</span>
          <span className="text-body-sm text-text-muted text-[11px]">Próximamente</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-body-sm text-text">Foto de perfil</span>
          <span className="text-body-sm text-text-muted text-[11px]">Próximamente</span>
        </div>
      </div>

      {/* Notifications */}
      <SectionLabel>Notificaciones</SectionLabel>
      <div className="mx-4 bg-card rounded-xl border border-border overflow-hidden">
        <PushToggle />
        <SettingsRow
          label="Próximos partidos"
          description="Aviso 1h antes del cierre de predicciones"
          checked={prefs.matchReminders}
          onChange={(v) => handlePrefChange("matchReminders", v)}
          disabled={isPending}
        />
        <SettingsRow
          label="Resultados"
          description="Tus puntos cuando termina un partido"
          checked={prefs.results}
          onChange={(v) => handlePrefChange("results", v)}
          disabled={isPending}
        />
        <SettingsRow
          label="Social"
          description="Likes y comentarios en tus posts"
          checked={prefs.socialReactions}
          onChange={(v) => handlePrefChange("socialReactions", v)}
          disabled={isPending}
        />
        <SettingsRow
          label="Resumen semanal"
          description="Tu performance de la semana"
          checked={prefs.weeklyDigest}
          onChange={(v) => handlePrefChange("weeklyDigest", v)}
          disabled={isPending}
        />
      </div>

      {/* Privacy */}
      <SectionLabel>Privacidad</SectionLabel>
      <div className="mx-4 bg-card rounded-xl border border-border overflow-hidden">
        <SettingsRow
          label="Mis predicciones visibles a socios"
          checked={visibility === "public"}
          onChange={handleVisibilityChange}
          disabled={isPending}
        />
      </div>

      {/* App */}
      <SectionLabel>App</SectionLabel>
      <div className="mx-4 bg-card rounded-xl border border-border overflow-hidden">
        <StaticRow label="Versión" value="1.0.0" />
        <Link
          href="/app/perfil/terminos"
          className="flex items-center justify-between px-4 py-3.5 border-b border-border hover:bg-elevated/50 transition-colors"
        >
          <span className="text-body-sm text-text">Términos y condiciones</span>
          <Icon name="arrow-right" size={16} className="text-text-muted" />
        </Link>
        <Link
          href="/app/perfil/privacidad"
          className="flex items-center justify-between px-4 py-3.5 hover:bg-elevated/50 transition-colors"
        >
          <span className="text-body-sm text-text">Política de privacidad</span>
          <Icon name="arrow-right" size={16} className="text-text-muted" />
        </Link>
      </div>

      {/* Sign out */}
      <div className="mx-4 mt-6">
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "w-full h-12 rounded-xl border border-error/40 bg-error/10",
            "text-error text-body-sm font-semibold transition-colors",
            "active:bg-error/20"
          )}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
