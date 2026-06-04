"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { setMatchResultAction } from "@/lib/admin/actions";
import { cn } from "@/lib/utils/cn";
import type { AdminMatch } from "@/lib/admin/queries";

function fmtKickoff(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

const STATUS_LABEL: Record<AdminMatch["status"], string> = {
  scheduled: "Programado",
  live: "En vivo",
  finished: "Finalizado",
  postponed: "Postergado",
};

function MatchRow({
  match,
  onSaved,
}: {
  match: AdminMatch;
  onSaved: (id: string, h: number, a: number) => void;
}) {
  const [home, setHome] = useState(match.homeScore != null ? String(match.homeScore) : "");
  const [away, setAway] = useState(match.awayScore != null ? String(match.awayScore) : "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function save() {
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (Number.isNaN(h) || Number.isNaN(a)) {
      toast({ variant: "error", message: "Cargá los dos goles." });
      return;
    }
    setSaving(true);
    const res = await setMatchResultAction({ matchId: match.id, homeScore: h, awayScore: a });
    setSaving(false);
    if (res.ok) {
      toast({ variant: "success", message: "Resultado cargado · puntos y ranking actualizados." });
      onSaved(match.id, h, a);
    } else {
      toast({ variant: "error", message: res.error });
    }
  }

  const isFinished = match.status === "finished";
  const numCls =
    "w-11 h-11 text-center rounded-md bg-elevated border border-border text-text font-display text-numeric-md tabular outline-none focus:border-primary";

  return (
    <div className="bg-card rounded-xl border border-border p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-text-muted">
          {fmtKickoff(match.kickoffAt)} · {match.phase}
        </span>
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide",
            isFinished ? "text-success" : match.status === "live" ? "text-error" : "text-text-muted"
          )}
        >
          {STATUS_LABEL[match.status]}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex-1 text-body-sm text-text font-semibold truncate text-right">
          {match.homeName}
        </span>
        <input
          inputMode="numeric"
          aria-label={`Goles ${match.homeName}`}
          value={home}
          onChange={(e) => setHome(e.target.value.replace(/\D/g, "").slice(0, 2))}
          className={numCls}
        />
        <span className="text-text-muted">–</span>
        <input
          inputMode="numeric"
          aria-label={`Goles ${match.awayName}`}
          value={away}
          onChange={(e) => setAway(e.target.value.replace(/\D/g, "").slice(0, 2))}
          className={numCls}
        />
        <span className="flex-1 text-body-sm text-text font-semibold truncate">{match.awayName}</span>
      </div>

      <Button
        size="sm"
        variant={isFinished ? "secondary" : "primary"}
        onClick={save}
        loading={saving}
        fullWidth
      >
        {isFinished ? "Corregir resultado" : "Cargar resultado"}
      </Button>
    </div>
  );
}

export function MatchResultManager({ matches }: { matches: AdminMatch[] }) {
  const [items, setItems] = useState(matches);
  const [q, setQ] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);

  function onSaved(id: string, h: number, a: number) {
    setItems((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "finished", homeScore: h, awayScore: a } : m
      )
    );
  }

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((m) => {
      if (onlyPending && m.status === "finished") return false;
      if (
        ql &&
        !`${m.homeName} ${m.awayName} ${m.homeCode} ${m.awayCode}`.toLowerCase().includes(ql)
      ) {
        return false;
      }
      return true;
    });
  }, [items, q, onlyPending]);

  return (
    <div className="px-4 flex flex-col gap-3">
      <input
        placeholder="Buscar equipo…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full h-10 px-3 rounded-lg bg-elevated border border-border text-body-sm text-text placeholder:text-text-muted outline-none focus:border-primary"
      />
      <label className="flex items-center gap-2 text-body-sm text-text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={onlyPending}
          onChange={(e) => setOnlyPending(e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        Solo partidos sin resultado
      </label>

      {filtered.length === 0 ? (
        <p className="text-body-sm text-text-muted text-center py-8">No hay partidos para mostrar.</p>
      ) : (
        filtered.map((m) => <MatchRow key={m.id} match={m} onSaved={onSaved} />)
      )}
    </div>
  );
}
