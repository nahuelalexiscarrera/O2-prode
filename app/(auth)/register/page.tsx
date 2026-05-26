"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  signUpAction,
  validateInviteAction,
  type ActionResult,
} from "@/lib/auth/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";

function ValidateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" fullWidth loading={pending}>
      Validar código
    </Button>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" fullWidth loading={pending}>
      Crear cuenta
    </Button>
  );
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [validatedCode, setValidatedCode] = useState<string | null>(null);

  const [validateState, validateAction] = useFormState<
    ActionResult<{ inviteCode: string }> | null,
    FormData
  >(async (prev, formData) => {
    const result = await validateInviteAction(prev, formData);
    if (result.ok && result.data) {
      setValidatedCode(result.data.inviteCode);
    }
    return result;
  }, null);

  const [signUpState, signUpFormAction] = useFormState<ActionResult | null, FormData>(
    signUpAction,
    null
  );
  const signUpErrorField = signUpState && !signUpState.ok ? signUpState.field : undefined;

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
        <h1 className="font-display text-display-md leading-tight text-text">
          Hacete socio O2 PRODE
        </h1>
        <p className="mt-3 text-body-md text-text-muted">
          El acceso es solo para socios del gimnasio.
        </p>
      </header>

      {!validatedCode ? (
        // ─── Paso 1: validar invite code ──────────────────────────────
        <form action={validateAction} className="flex flex-col gap-4" noValidate>
          <Input
            label="Código de invitación"
            name="inviteCode"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            required
            placeholder="BETA-XX"
            state={validateState && !validateState.ok ? "error" : "default"}
          />

          {validateState && !validateState.ok && (
            <p role="alert" className="text-body-sm text-error">
              {validateState.error}
            </p>
          )}

          <div className="mt-2">
            <ValidateButton />
          </div>

          <p className="text-body-xs text-text-muted text-center mt-4">
            Pedile tu código al staff del gym.
          </p>
        </form>
      ) : (
        // ─── Paso 2: crear cuenta ─────────────────────────────────────
        <form action={signUpFormAction} className="flex flex-col gap-4" noValidate>
          <div className="rounded-md bg-surface border border-success/30 px-4 py-3 flex items-center gap-3 mb-2">
            <Icon name="check" size={18} className="text-success" />
            <div className="flex-1">
              <p className="text-body-sm text-text">
                Código válido: <span className="font-semibold">{validatedCode}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setValidatedCode(null)}
              className="text-body-xs text-text-muted hover:text-text underline"
            >
              Cambiar
            </button>
          </div>

          {/* Re-enviar el code en este form para que el server action lo reciba */}
          <input type="hidden" name="inviteCode" value={validatedCode} />

          <Input
            label="Nombre completo"
            name="name"
            type="text"
            autoComplete="name"
            required
            state={signUpErrorField === "name" ? "error" : "default"}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            state={signUpErrorField === "email" ? "error" : "default"}
          />

          <Input
            label="Contraseña"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            leftIcon="lock"
            state={signUpErrorField === "password" ? "error" : "default"}
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
            state={signUpErrorField === "passwordConfirm" ? "error" : "default"}
          />

          <label className="flex items-start gap-3 mt-2 cursor-pointer">
            <input
              type="checkbox"
              name="acceptTerms"
              required
              className="mt-1 w-4 h-4 accent-primary"
            />
            <span className="text-body-sm text-text-muted leading-relaxed">
              Acepto los{" "}
              <Link href="/app/perfil/terminos" className="text-primary underline">
                términos
              </Link>{" "}
              y la{" "}
              <Link href="/app/perfil/privacidad" className="text-primary underline">
                política de privacidad
              </Link>
              .
            </span>
          </label>

          {signUpState && !signUpState.ok && (
            <p role="alert" className="text-body-sm text-error">
              {signUpState.error}
            </p>
          )}

          <div className="mt-2">
            <SubmitButton />
          </div>
        </form>
      )}

      <footer className="mt-auto pt-10 text-center text-body-sm text-text-muted">
        ¿Ya sos socio?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Iniciá sesión
        </Link>
      </footer>
    </div>
  );
}
