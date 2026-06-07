"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordAction, type ActionResult } from "@/lib/auth/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" fullWidth loading={pending}>
      Cambiar contraseña
    </Button>
  );
}

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useFormState<ActionResult | null, FormData>(
    resetPasswordAction,
    null
  );
  const errorField = state && !state.ok ? state.field : undefined;

  // Defensa en profundidad: el flujo principal de recovery pasa por /auth/confirm
  // (template custom) y ya deja la sesión lista. Pero si el link llega como
  // ?code=... (template default de Supabase), lo intercambiamos acá para
  // establecer la sesión de recovery; sin esto, updateUser fallaría con "link
  // vencido". (Mismo dispositivo; cross-device sigue usando /auth/confirm.)
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    createClient()
      .auth.exchangeCodeForSession(code)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      <header className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-body-sm text-text-muted hover:text-text mb-6"
        >
          <Icon name="arrow-left" size={16} />
          Volver
        </Link>
        <h1 className="font-display text-display-md leading-tight text-text">Nueva contraseña</h1>
        <p className="mt-3 text-body-md text-text-muted">
          Elegí una contraseña nueva para tu cuenta.
        </p>
      </header>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Input
          label="Nueva contraseña"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          leftIcon="lock"
          state={errorField === "password" ? "error" : "default"}
          helper="Mínimo 8 caracteres."
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

        <Input
          label="Repetí la contraseña"
          name="passwordConfirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          leftIcon="lock"
          state={errorField === "passwordConfirm" ? "error" : "default"}
        />

        {state && !state.ok && (
          <p role="alert" className="text-body-sm text-error">
            {state.error}
          </p>
        )}

        <div className="mt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
