"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { signInAction, type ActionResult } from "@/lib/auth/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";

function ConfirmBanner() {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirm") === "1";
  const errorConfirm = searchParams.get("error") === "confirm";
  if (!confirmed && !errorConfirm) return null;

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

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useFormState<ActionResult | null, FormData>(signInAction, null);
  const errorField = state && !state.ok ? state.field : undefined;

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
