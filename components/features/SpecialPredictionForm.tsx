"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Flag } from "@/components/ui/Flag";
import { upsertSpecialPrediction } from "@/lib/predictions/actions";

type Team = { code: string; name: string };
type Initial = {
  champion_code: string;
  runner_up_code: string;
  group_stage_best_code: string;
  revelation_code: string;
} | null;

const FIELDS = [
  { key: "championCode", label: "Campeón", hint: "Quién levanta la copa" },
  { key: "runnerUpCode", label: "Subcampeón", hint: "El finalista que pierde" },
  { key: "groupStageBestCode", label: "Mejor de la fase de grupos", hint: "El que arranca más fuerte" },
  { key: "revelationCode", label: "Revelación", hint: "La sorpresa del torneo" },
] as const;

export function SpecialPredictionForm({
  teams,
  initial,
  locked,
}: {
  teams: Team[];
  initial: Initial;
  locked: boolean;
}) {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({
    championCode: initial?.champion_code ?? "",
    runnerUpCode: initial?.runner_up_code ?? "",
    groupStageBestCode: initial?.group_stage_best_code ?? "",
    revelationCode: initial?.revelation_code ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (Object.values(values).some((v) => !v)) {
      toast({ variant: "error", message: "Completá las 4 predicciones." });
      return;
    }
    setSaving(true);
    const res = await upsertSpecialPrediction(values);
    setSaving(false);
    if ("error" in res && res.error) toast({ variant: "error", message: res.error });
    else toast({ variant: "success", message: "Predicción especial guardada" });
  }

  return (
    <div className="px-4 pt-3 flex flex-col gap-4">
      <p className="text-body-sm text-text-muted">
        {locked
          ? "El torneo ya arrancó: tu predicción especial quedó cerrada."
          : "Tus apuestas del torneo. Cierran cuando arranca el Mundial y suman puntos aparte."}
      </p>

      {FIELDS.map((f) => {
        const sel = values[f.key] ?? "";
        return (
          <label key={f.key} className="flex flex-col gap-1.5">
            <span className="text-body-xs font-bold uppercase tracking-[0.1em] text-text-muted">
              {f.label}
            </span>
            <div className="flex items-center gap-2">
              {sel ? <Flag code={sel} size="md" /> : null}
              <select
                value={sel}
                disabled={locked}
                onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                className="flex-1 h-12 px-3 rounded-md bg-surface border border-border text-text outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="">Elegir equipo…</option>
                {teams.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-text-disabled">{f.hint}</span>
          </label>
        );
      })}

      {!locked && (
        <Button onClick={save} loading={saving} fullWidth>
          Guardar predicción especial
        </Button>
      )}
    </div>
  );
}
