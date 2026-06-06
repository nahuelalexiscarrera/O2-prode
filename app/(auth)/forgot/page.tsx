"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Status = "idle" | "loading" | "sent" | "error";

export default function ForgotPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      setErrorMsg("Email inválido.");
      setStatus("error");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      // Mensaje neutro: no filtramos si el email existe.
      console.error("[forgot] reset error", error);
    }
    setStatus("sent");
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
          Recuperar contraseña
        </h1>
        <p className="mt-3 text-body-md text-text-muted">
          Te enviamos un link al email asociado a tu cuenta.
        </p>
      </header>

      {status === "sent" ? (
        <div className="rounded-md bg-surface border border-border px-6 py-8 text-center">
          <Icon name="check" size={32} className="text-success mb-3" />
          <h2 className="font-display text-heading-md text-text mb-2">Revisá tu email</h2>
          <p className="text-body-sm text-text-muted">
            Si el email está registrado, te llegó un link para recuperar la contraseña.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            state={status === "error" ? "error" : "default"}
          />

          {errorMsg && (
            <p role="alert" className="text-body-sm text-error">
              {errorMsg}
            </p>
          )}

          <div className="mt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={status === "loading"}
            >
              Enviar link
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
