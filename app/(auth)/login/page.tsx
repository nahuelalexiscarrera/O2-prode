"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { signInAction, type ActionResult } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";

function ConfirmBanner() {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirm") === "1";
  const errorConfirm = searchParams.get("error") === "confirm";
  const errorOauth = searchParams.get("error") === "oauth";
  if (!confirmed && !errorConfirm && !errorOauth) return null;

  if (errorOauth) {
    const detail = searchParams.get("detail");
    return (
      <div className="mb-6 rounded-md bg-surface border border-error/30 px-4 py-3 flex items-start gap-3">
        <Icon name="info" size={18} className="text-error mt-0.5" />
        <p className="text-body-sm text-text">
          No se pudo iniciar sesión con Google. Probá de nuevo.
          {detail && (
            <span className="block mt-1 text-text-muted break-words">{detail}</span>
          )}
        </p>
      </div>
    );
  }

  if (errorConfirm) {
    return (
      <div className="mb-6 rounded-md bg-surface border border-error/30 px-4 py-3 flex items-start gap-3">
        <Icon name="info" size={18} className="text-error mt-0.5" />
        <p className="text-body-sm text-text">
          El link de confirmación venció o ya se usó. Si ya confirmaste, entrá con tu contraseña; si
          no, registrate de nuevo para recibir uno nuevo.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-md bg-surface border border-info/30 px-4 py-3 flex items-start gap-3">
      <Icon name="info" size={18} className="text-info mt-0.5" />
      <p className="text-body-sm text-text">
        Cuenta creada. Revisá tu email para confirmarla y después entrá con tu contraseña.
      </p>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" fullWidth loading={pending}>
      Ingresar
    </Button>
  );
}

/**
 * Botón "Continuar con Google". El logo oficial de Google (SVG inline) es un
 * requisito de las brand guidelines de Google para botones OAuth — es un logo de
 * marca externa, no iconografía decorativa de la app.
 */
function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-white text-[#1f1f1f] font-semibold text-body-md transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      {loading ? "Conectando…" : "Continuar con Google"}
    </button>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [state, formAction] = useFormState<ActionResult | null, FormData>(signInAction, null);
  const errorField = state && !state.ok ? state.field : undefined;

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // Si signInWithOAuth no redirige (error de init), reactivamos el botón.
    if (error) setGoogleLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-10">
      {/* Logo real O2 Wellness Club */}
      <div className="flex justify-center pt-2">
        <Image
          src="/logo.png"
          alt="O2 Wellness Club"
          width={150}
          height={150}
          priority
          className="h-36 w-36 object-contain select-none"
        />
      </div>

      {/* Aire */}
      <div className="flex-1 min-h-[6vh]" />

      {/* Título editorial */}
      <header className="mb-6">
        <h1 className="font-display uppercase leading-[0.85] text-text">
          <span className="block text-[1.75rem] tracking-[0.10em]">Prode</span>
          <span className="block text-[3.5rem] tracking-[0.01em] text-primary">Mundial</span>
        </h1>
        <p className="mt-4 text-body-md text-text-secondary text-balance text-center">
          Cada partido suma. Cada acierto te acerca al podio.
        </p>
      </header>

      <Suspense fallback={null}>
        <ConfirmBanner />
      </Suspense>

      {/* Google OAuth — método primario de ingreso */}
      <GoogleButton onClick={handleGoogle} loading={googleLoading} />

      {/* Divisor */}
      <div className="flex items-center gap-3 my-5" aria-hidden="true">
        <span className="flex-1 h-px bg-border" />
        <span className="text-body-sm text-text-disabled uppercase tracking-wider">o</span>
        <span className="flex-1 h-px bg-border" />
      </div>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          state={errorField === "email" ? "error" : "default"}
        />

        <Input
          label="Contraseña"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          leftIcon="lock"
          state={errorField === "password" ? "error" : "default"}
          rightElement={
            <IconButton
              type="button"
              label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              icon="eye"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword((v) => !v)}
            />
          }
        />

        {state && !state.ok && (
          <p role="alert" className="text-body-sm text-error">
            {state.error}
          </p>
        )}

        <div className="text-right -mt-2">
          <Link href="/forgot" className="text-body-sm text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="mt-2">
          <SubmitButton />
        </div>
      </form>

      <footer className="mt-8 text-center">
        <p className="text-body-sm text-text-muted">
          ¿Sos socio nuevo?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Registrate
          </Link>
        </p>
        <p className="mt-4 text-[10px] uppercase tracking-[0.28em] text-text-disabled">
          #PRODEMUNDIALO2
        </p>
      </footer>
    </div>
  );
}
