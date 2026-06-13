import { PrizeCard } from "@/components/features/PrizeCard";
import { PRIZES, prizeTone } from "@/lib/i18n/prizes";

/**
 * O2 PRODE — Bloque informativo de premios.
 *
 * Sección estática embebida al final de /ranking: comunica los 7 premios del
 * torneo + la regla de no-acumulación. Sin estado, sin DB, sin cálculo. El copy
 * vive en lib/i18n/es-AR.json#prizes. El staff O2 entrega los premios a mano.
 *
 * Anchor `#premios` (con scroll-mt para los accesos desde Home/Perfil).
 */
export function PrizesInfoBlock() {
  return (
    <section
      id={PRIZES.anchorId}
      aria-labelledby="premios-title"
      className="px-4 scroll-mt-20"
    >
      {/* Header */}
      <header className="mb-4">
        <p className="text-body-xs uppercase tracking-wide text-text-muted">
          {PRIZES.sectionEyebrow}
        </p>
        <h2 id="premios-title" className="mt-1 font-display text-display-md text-text">
          {PRIZES.sectionTitle}
        </h2>
      </header>

      {/* Stack de 7 premios — scrolleable */}
      <div
        className="overflow-y-auto max-h-[240px] flex flex-col gap-3 pr-1"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        {PRIZES.tiers.map((tier, i) => (
          <PrizeCard
            key={tier.id}
            phaseLabel={tier.phaseLabel}
            rankLabel={tier.rankLabel}
            reward={tier.reward}
            tone={prizeTone(i)}
          />
        ))}
      </div>

      {/* Footer: regla de oro + nota de coordinación */}
      <footer className="mt-5 flex flex-col gap-3">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-body-sm font-bold text-primary">{PRIZES.ruleTitle}</p>
          <p className="mt-1.5 text-body-md text-text-muted">{PRIZES.ruleBody}</p>
        </div>
        <p className="text-body-sm italic text-text-muted">{PRIZES.coordinationNote}</p>
      </footer>
    </section>
  );
}
