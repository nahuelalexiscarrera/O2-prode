"use client";

import { useFormState, useFormStatus } from "react-dom";
import { completeOnboardingAction, type OnboardingResult } from "@/lib/auth/onboarding-actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" fullWidth loading={pending}>
      Continuar
    </Button>
  );
}

const BRANCHES = [
  { value: "rufina", label: "Rufina" },
  { value: "cofico", label: "Cofico" },
] as const;

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, formAction] = useFormState<OnboardingResult | null, FormData>(
    completeOnboardingAction,
    null
  );
  const errorField = state && !state.ok ? state.field : undefined;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-10">
      <header className="mb-8">
        <h1 className="font-display text-display-md leading-tight text-text">Completá tu perfil</h1>
        <p className="mt-3 text-body-md text-text-muted">
          Un par de datos para terminar de sumarte a O2 PRODE.
        </p>
      </header>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
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

        {/* Sucursal (obligatoria) — radios estilizados, sin JS de estado */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-body-sm font-semibold text-text mb-1">Sucursal</legend>
          <div className="grid grid-cols-2 gap-3">
            {BRANCHES.map((b) => (
              <label key={b.value} className="cursor-pointer">
                <input type="radio" name="branch" value={b.value} className="sr-only peer" required />
                <span
                  className={
                    "flex items-center justify-center h-12 rounded-xl border text-body-md font-semibold " +
                    "border-border text-text-muted transition-colors " +
                    "peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/10 " +
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50"
                  }
                >
                  {b.label}
                </span>
              </label>
            ))}
          </div>
          {errorField === "branch" && (
            <p role="alert" className="text-body-sm text-error">
              Elegí tu sucursal.
            </p>
          )}
        </fieldset>

        {state && !state.ok && !errorField && (
          <p role="alert" className="text-body-sm text-error">
            {state.error}
          </p>
        )}
        {state && !state.ok && errorField && errorField !== "branch" && (
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
