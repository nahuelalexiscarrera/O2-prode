"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createSupportTicketAction } from "@/lib/support/actions";

const SEVERITIES = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
] as const;

// Mismo estilo para todos los controles → form consistente, sin labels
// flotantes que se superpongan. text-base (16px) evita el auto-zoom de iOS.
const field =
  "w-full rounded-md bg-surface border border-border text-text text-base px-3 outline-none focus:border-primary";

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-body-xs font-bold uppercase tracking-wide text-text-muted">{children}</span>
  );
}

export function SupportTicketForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [severity, setSeverity] = useState("media");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setOkMsg(null);
    const res = await createSupportTicketAction({ title, area, severity, description });
    setSaving(false);

    if (!res.ok) {
      toast({ variant: "error", message: res.error });
      return;
    }

    setOkMsg(`Ticket ${res.ticketNumber} creado. Lo revisamos y te respondemos a la brevedad.`);
    toast({ variant: "success", message: `Ticket ${res.ticketNumber} creado` });
    setTitle("");
    setArea("");
    setSeverity("media");
    setDescription("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4">
      <label className="flex flex-col gap-1.5">
        <Caption>Título</Caption>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resumen corto del problema"
          required
          className={`${field} h-12`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <Caption>Detalle del error / pasos</Caption>
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
          placeholder="Qué pasó, en qué pantalla, mensaje de error, pasos para reproducir…"
          className={`${field} py-2.5 resize-y`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <Caption>Severidad</Caption>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className={`${field} h-12`}
        >
          {SEVERITIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <Caption>Área (opcional)</Caption>
        <input
          name="area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Ej: Muro, Ranking"
          className={`${field} h-12`}
        />
      </label>

      {okMsg && (
        <p
          aria-live="polite"
          className="text-body-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2"
        >
          {okMsg}
        </p>
      )}

      <Button type="submit" loading={saving} fullWidth>
        Crear ticket
      </Button>
    </form>
  );
}
