"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createSupportTicketAction } from "@/lib/support/actions";

const SEVERITIES = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
] as const;

export function SupportTicketForm({ jiraConfigured }: { jiraConfigured: boolean }) {
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

    if (!res.jiraConfigured) {
      setOkMsg(`Ticket ${res.ticketNumber} creado (guardado local · Jira no configurado todavía).`);
      toast({ variant: "success", message: `Ticket ${res.ticketNumber} creado` });
    } else if (res.jiraUrl) {
      setOkMsg(`Ticket ${res.ticketNumber} creado y enviado a Jira.`);
      toast({ variant: "success", message: `Ticket ${res.ticketNumber} enviado a Jira` });
    } else {
      setOkMsg(`Ticket ${res.ticketNumber} guardado, pero falló el envío a Jira: ${res.jiraError ?? "error"}`);
      toast({ variant: "warning", message: `Ticket ${res.ticketNumber}: falló Jira` });
    }

    setTitle("");
    setArea("");
    setSeverity("media");
    setDescription("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4">
      {!jiraConfigured && (
        <p className="text-[11px] text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
          Jira no está configurado: los tickets se guardan local hasta cargar las credenciales (JIRA_*).
        </p>
      )}

      <Input
        label="Título"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Resumen corto del problema"
        required
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-body-xs font-bold uppercase tracking-wide text-text-muted">
          Detalle del error / pasos
        </span>
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
          placeholder="Qué pasó, en qué pantalla, mensaje de error, pasos para reproducir…"
          className="w-full rounded-md bg-surface border border-border text-text px-3 py-2.5 outline-none focus:border-primary resize-y"
        />
      </div>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1.5 flex-1">
          <span className="text-body-xs font-bold uppercase tracking-wide text-text-muted">Severidad</span>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="h-12 px-3 rounded-md bg-surface border border-border text-text outline-none focus:border-primary"
          >
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex-1">
          <Input
            label="Área (opcional)"
            name="area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Ej: Muro, Ranking"
          />
        </div>
      </div>

      {okMsg && (
        <p aria-live="polite" className="text-body-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
          {okMsg}
        </p>
      )}

      <Button type="submit" loading={saving} fullWidth>
        Crear ticket
      </Button>
    </form>
  );
}
