"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { completeOnboardingAction, type OnboardingResult } from "@/lib/auth/onboarding-actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
type Mode = "socio" | "codigo" | "externo";

const MODES: { value: Mode; label: string; sub: string }[] = [
  { value: "socio",   label: "Soy socio O2",        sub: "Elegí tu local para seguir" },
  { value: "codigo",  label: "Tengo un código",      sub: "Me invitó alguien del club" },
  { value: "externo", label: "Continuar sin código", sub: "Jugar desde afuera del club" },
];

const BRANCHES = [
  { value: "rufina", label: "Rufina" },
  { value: "cofico", label: "Cofico" },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" fullWidth loading={pending}>
      Continuar
    </Button>
  );
}

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, formAction] = useFormState<OnboardingResult | null, FormData>(
    completeOnboardingAction,
    null
  );
  const [mode, setMode] = useState<Mode | null>(null);
  const errorField = state && !state.ok ? state.field : undefined;
  const errorMsg   = state && !state.ok ? state.error : undefined;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-10">
      <header className="mb-8">
        <h1 className="font-display text-display-md leading-tight text-text">Completá tu perfil</h1>
        <p className="mt-3 text-body-md text-text-muted">
          Un par de datos para terminar de sumarte a O2 PRODE.
        </p>
      </header>

      <form action={formAction} className="flex flex-col gap-5" noValidate>
        <Input
          label="Nombre"
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={defaultName}
          state={errorField === "name" ? "error" : "default"}
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

        {/* Selector de modo: socio / código / externo */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-body-sm font-semibold text-text mb-1">
            ¿Cómo ingresás?
          </legend>

          <div className="flex flex-col gap-2">
            {MODES.map((m) => {
              const selected = mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  )}
                >
                  <span
                    className={cn(
                      "text-body-sm font-semibold",
                      selected ? "text-primary" : "text-text"
                    )}
                  >
                    {m.label}
                  </span>
                  <span className="text-[11px] text-text-muted">{m.sub}</span>
                </button>
              );
            })}
          </div>

          {errorField === "mode" && (
            <p role="alert" className="text-body-sm text-error">
              {errorMsg}
            </p>
          )}
        </fieldset>

        {/* Local — solo visible cuando mode = socio */}
        {mode === "socio" && (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-body-sm font-semibold text-text mb-1">Tu local</legend>
            <div className="grid grid-cols-2 gap-3">
              {BRANCHES.map((b) => (
                <label key={b.value} className="cursor-pointer">
                  <input type="radio" name="branch" value={b.value} className="sr-only peer" />
                  <span
                    className={cn(
                      "flex items-center justify-center h-12 rounded-xl border text-body-md font-semibold transition-colors",
                      "border-border text-text-muted",
                      "peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/10",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50"
                    )}
                  >
                    {b.label}
                  </span>
                </label>
              ))}
            </div>
            {errorField === "branch" && (
              <p role="alert" className="text-body-sm text-error">
                {errorMsg}
              </p>
            )}
          </fieldset>
        )}

        {/* Código de referido — solo visible cuando mode = codigo */}
        {mode === "codigo" && (
          <Input
            label="Código de referido"
            name="referral_code"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="Ej: AB12CD"
            state={errorField === "referral_code" ? "error" : "default"}
            helper="El código de 6 letras que te compartió un socio."
          />
        )}

        {/* Campo oculto con el modo seleccionado */}
        <input type="hidden" name="mode" value={mode ?? ""} />

        {/* Error general (no asociado a campo) */}
        {state && !state.ok && !errorField && (
          <p role="alert" className="text-body-sm text-error">
            {state.error}
          </p>
        )}

        <div className="mt-1">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
