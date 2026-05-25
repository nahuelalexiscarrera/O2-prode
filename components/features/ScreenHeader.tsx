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

export function ScreenHeader({ title, backHref, className, actions }: ScreenHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center gap-2 px-4",
        "pt-[calc(1rem+env(safe-area-inset-top))] pb-3",
        className
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          aria-label="Volver"
          className="flex items-center justify-center w-9 h-9 rounded-full -ml-1 text-text-muted hover:text-text transition-colors"
        >
          <Icon name="arrow-left" size={20} />
        </Link>
      )}
      <h1 className="flex-1 font-display text-heading-md text-text uppercase tracking-wide">
        {title}
      </h1>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </header>
  );
}
