"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  signUpAction,
  resendConfirmationAction,
  type ActionResult,
} from "@/lib/auth/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" fullWidth loading={pending}>
      Crear cuenta
    </Button>
  );
}

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="md" fullWidth loading={pending}>
      Reenviar email
    </Button>
  );
}

/** Pantalla post-registro: la cuenta se creó pero falta confirmar el email. */
function ConfirmSentScreen({ email }: { email: string }) {
  const [resendState, resendAction] = useFormState<ActionResult | null, FormData>(
    resendConfirmationAction,
    null
  );

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ background: "rgba(217,255,63,0.12)", border: "1px solid rgba(217,255,63,0.4)" }}
        >
          <Icon name="check" size={36} className="text-primary" />
        </div>

        <h1 className="font-display text-display-md leading-tight text-text">Revisá tu email</h1>
        <p className="mt-4 text-body-md text-text-muted">
          Te enviamos un link de confirmación a{" "}
          <span className="text-text font-semibold break-all">{email}</span>. Abrilo para activar
          tu cuenta y entrar a jugar.
        </p>
        <p className="mt-3 text-body-sm text-text-disabled">
          ¿No te llegó? Fijate en la carpeta de spam, o reenvialo.
        </p>

        <form action={resendAction} className="w-full mt-8">
          <input type="hidden" name="email" value={email} />
          <ResendButton />
        </form>

        {resendState?.ok && (
          <p role="status" className="mt-3 text-body-sm text-primary">
            Listo, te reenviamos el email.
          </p>
        )}
        {resendState && !resendState.ok && (
          <p role="alert" className="mt-3 text-body-sm text-error">
            {resendState.error}
          </p>
        )}

        <Link href="/login" className="mt-8 text-body-sm text-primary font-semibold hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useFormState<ActionResult<{ email: string }> | null, FormData>(
    signUpAction,
    null
  );
  const errorField = state && !state.ok ? state.field : undefined;

  // Registro OK → falta confirmar el email.
  if (state?.ok && state.data?.email) {
    return <ConfirmSentScreen email={state.data.email} />;
  }

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
          Creá tu cuenta y empezá a predecir los partidos del Mundial.
        </p>
      </header>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Input
          label="Nombre completo"
          name="name"
          type="text"
          autoComplete="name"
          required
          state={errorField === "name" ? "error" : "default"}
        />

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          state={errorField === "email" ? "error" : "default"}
          helper="Te vamos a mandar un link para confirmarlo."
        />

        <Input
          label="Teléfono (opcional)"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          state={errorField === "phone" ? "error" : "default"}
          helper="Para avisarte de novedades del torneo."
        />

        <Input
          label="Código de referido (opcional)"
          name="referralCode"
          type="text"
          autoComplete="off"
          helper="¿Te invitó un socio? Poné su código y sumás a su tribu."
        />

        <Input
          label="Contraseña"
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

        <label className="flex items-start gap-3 mt-2 cursor-pointer">
          <input
            type="checkbox"
            name="acceptTerms"
            required
            className="mt-1 w-4 h-4 accent-primary"
          />
          <span className="text-body-sm text-text-muted leading-relaxed">
            Acepto los{" "}
            <Link href="/terminos" className="text-primary underline" target="_blank">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" className="text-primary underline" target="_blank">
              política de privacidad
            </Link>
            .
          </span>
        </label>

        {state && !state.ok && (
          <p role="alert" className="text-body-sm text-error">
            {state.error}
          </p>
        )}

        <div className="mt-2">
          <SubmitButton />
        </div>
      </form>

      <footer className="mt-auto pt-10 text-center text-body-sm text-text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Iniciá sesión
        </Link>
      </footer>
    </div>
  );
}
