"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { changePasswordAction } from "@/lib/auth/actions";

export function ChangePasswordSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSaving(true);
    setError(null);
    setErrorField(null);

    const res = await changePasswordAction(new FormData(form));
    setSaving(false);

    if (res.ok) {
      form.reset();
      toast({ variant: "success", message: "Contraseña actualizada" });
      onClose();
    } else {
      setError(res.error);
      setErrorField(res.field ?? null);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Cambiar contraseña">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-6 pt-2" noValidate>
        <Input
          label="Contraseña actual"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          state={errorField === "currentPassword" ? "error" : "default"}
        />
        <Input
          label="Nueva contraseña"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          state={errorField === "newPassword" ? "error" : "default"}
        />
        <Input
          label="Repetir nueva contraseña"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          state={errorField === "passwordConfirm" ? "error" : "default"}
        />

        {error && (
          <p role="alert" className="text-body-sm text-error">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={saving}>
          Guardar contraseña
        </Button>
      </form>
    </BottomSheet>
  );
}
