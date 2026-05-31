import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

interface ScreenHeaderProps {
  title: string;
  backHref?: string;
  className?: string;
  /** Right-side slot: notification bell, action button, etc. */
  actions?: ReactNode;
}

/**
 * Header de pantalla — concepto "Pro-Performance Elite".
 *
 * - Top-level (sin backHref): barra de marca "O2 WELLNESS" + acciones a la
 *   derecha, y el título de la pantalla como headline Anton grande debajo.
 * - Sub-pantalla (con backHref): header compacto flecha + título.
 */
export function ScreenHeader({ title, backHref, className, actions }: ScreenHeaderProps) {
  if (backHref) {
    return (
      <header
        className={cn(
          "flex items-center gap-2 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3",
          className
        )}
      >
        <Link
          href={backHref}
          aria-label="Volver"
          className="flex items-center justify-center w-9 h-9 -ml-1 text-text-muted hover:text-text transition-colors"
        >
          <Icon name="arrow-left" size={20} />
        </Link>
        <h1 className="flex-1 font-display text-heading-md text-text uppercase tracking-wide">
          {title}
        </h1>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </header>
    );
  }

  return (
    <header className={cn("px-4 pt-[calc(0.5rem+env(safe-area-inset-top))]", className)}>
      {/* Barra de marca */}
      <div className="flex h-12 items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="o2-mark" size={26} className="text-primary" />
          <span className="font-display text-heading-md uppercase tracking-[0.06em] leading-none text-text">
            O2 Wellness
          </span>
        </div>
        {actions && <div className="flex items-center gap-1 text-text-muted">{actions}</div>}
      </div>

      {/* Título de la pantalla */}
      {title && (
        <h1 className="mt-4 font-display text-heading-lg uppercase tracking-wide leading-none text-text">
          {title}
        </h1>
      )}
    </header>
  );
}
