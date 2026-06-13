import { cn } from "@/lib/utils/cn";
import type { PrizeTone } from "@/lib/i18n/prizes";

interface PrizeCardProps {
  /** "Fase de grupos" | "Octavos de final" | ... | "Final" */
  phaseLabel: string;
  /** "1° puesto" | "Líder acumulado" | "Campeón del PRODE" | ... */
  rankLabel: string;
  /** "1 mes de O2 gratis" | "1 año de O2 gratis" | ... */
  reward: string;
  /** Jerarquía visual: las 3 cards de la Final reciben tratamiento diferenciado. */
  tone?: PrizeTone;
  className?: string;
}

const TONE_STYLES: Record<PrizeTone, string> = {
  default:   "border-border",
  champion:  "border-[#D4AF37]",   // oro
  runnerUp:  "border-[#A8A9AD]",   // plata
  third:     "border-[#CD7F32]",   // bronce
};

/**
 * Card estática de un premio del torneo. Server Component (sin estado).
 * Eyebrow "FASE · PUESTO" + reward grande en Anton/primary.
 */
export function PrizeCard({
  phaseLabel,
  rankLabel,
  reward,
  tone = "default",
  className,
}: PrizeCardProps) {
  return (
    <article className={cn("bg-card rounded-lg border p-4", TONE_STYLES[tone], className)}>
      <p className="text-body-xs uppercase tracking-wide text-text-muted">
        {phaseLabel} · {rankLabel}
      </p>
      <h3 className="mt-1 font-display text-heading-md text-primary">{reward}</h3>
    </article>
  );
}
