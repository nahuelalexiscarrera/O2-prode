"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { setAchievementPointsAction } from "@/lib/admin/actions";
import type { AdminAchievement } from "@/lib/admin/queries";

const CAT_LABEL: Record<string, string> = {
  skill: "Skill",
  consistency: "Constancia",
  social: "Social",
  position: "Posición",
};
const CAT_ORDER = ["skill", "consistency", "social", "position"];

function Row({ a }: { a: AdminAchievement }) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(a.pointsBonus);
  const [val, setVal] = useState(a.pointsBonus);
  const [saving, setSaving] = useState(false);
  const dirty = val !== saved;

  async function save() {
    setSaving(true);
    const res = await setAchievementPointsAction({ id: a.id, pointsBonus: val });
    setSaving(false);
    if (res.ok) {
      setSaved(val);
      toast({ variant: "success", message: `${a.name}: ${val} pts` });
    } else {
      toast({ variant: "error", message: res.error });
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-body-sm text-text font-medium truncate">{a.name}</span>
        <span className="text-[11px] text-text-muted truncate">{a.description}</span>
      </div>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={500}
        value={val}
        onChange={(e) => setVal(Math.max(0, Math.min(500, Number(e.target.value) || 0)))}
        aria-label={`Puntos de ${a.name}`}
        className="w-16 h-10 px-2 text-center rounded-md bg-surface border border-border text-text text-base outline-none focus:border-primary"
      />
      {dirty ? (
        <Button size="sm" onClick={save} loading={saving}>
          Guardar
        </Button>
      ) : (
        <span className="w-[68px] text-center text-[11px] text-text-disabled">guardado</span>
      )}
    </div>
  );
}

export function AchievementPointsEditor({ achievements }: { achievements: AdminAchievement[] }) {
  const byCat = CAT_ORDER.map((cat) => ({
    cat,
    items: achievements.filter((a) => a.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {byCat.map((g) => (
        <div key={g.cat}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-4 pb-1 block">
            {CAT_LABEL[g.cat] ?? g.cat}
          </span>
          <div className="mx-4 bg-card rounded-xl border border-border overflow-hidden">
            {g.items.map((a) => (
              <Row key={a.id} a={a} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
