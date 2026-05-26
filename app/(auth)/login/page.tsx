"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signInAction, type ActionResult } from "@/lib/auth/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";

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
    <div className="min-h-screen flex flex-col px-6 py-10">
      <header className="mb-10">
        <h1 className="font-display text-display-md leading-tight text-text">PRODE MUNDIAL O2</h1>
        <p className="mt-3 text-body-md text-text-muted">
          Entrá con tu cuenta de socio O2.
        </p>
      </header>

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

      <footer className="mt-auto pt-10 text-center text-body-sm text-text-muted">
        ¿Sos socio nuevo?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Registrate
        </Link>
      </footer>
    </div>
  );
}
