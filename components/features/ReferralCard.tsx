"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** Muestra el código de referido del socio + un botón para copiarlo. */
export function ReferralCard({ code, friends }: { code: string; friends: number }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="mx-4 mb-6 bg-card rounded-xl border border-border p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-2">
        Tu código de referido
      </p>
      <button
        type="button"
        onClick={copy}
        className="w-full flex items-center justify-between gap-3 bg-elevated rounded-lg px-4 py-3 active:opacity-80 transition-opacity"
      >
        <span className="font-display text-heading-md text-primary tracking-[0.2em]">{code}</span>
        <span className="flex items-center gap-1.5 text-body-sm text-text-muted">
          <Icon name={copied ? "check" : "share"} size={16} />
          {copied ? "Copiado" : "Copiar"}
        </span>
      </button>
      <p className="text-body-sm text-text-muted mt-3 leading-relaxed">
        Invitá a tus amigos del gym: cuando 3 se sumen con tu código, desbloqueás el logro{" "}
        <span className="text-text font-semibold">Tribu</span>.
        {friends > 0 ? ` Ya se sumaron ${friends}.` : ""}
      </p>
    </div>
  );
}
