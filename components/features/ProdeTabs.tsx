"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

export function ProdeTabs() {
  const pathname = usePathname();
  const isGroups = pathname.startsWith("/app/prode/grupos");
  const isKnockout = pathname.startsWith("/app/prode/eliminatorias");
  const isSpecial = pathname.startsWith("/app/prode/predicciones");

  const tabClass = (active: boolean) =>
    cn(
      "flex-1 flex items-center justify-center h-10 rounded-xl gap-1.5 text-center",
      "text-body-sm font-semibold transition-colors",
      active ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text"
    );

  return (
    <div role="tablist" aria-label="Secciones del prode" className="flex gap-1 px-4">
      <Link href="/app/prode/grupos/a" role="tab" aria-selected={isGroups} className={tabClass(isGroups)}>
        Grupos
      </Link>

      <Link
        href="/app/prode/eliminatorias"
        role="tab"
        aria-selected={isKnockout}
        className={tabClass(isKnockout)}
      >
        Eliminatorias
        {!isKnockout && <Icon name="lock" size={11} className="text-text-muted" />}
      </Link>

      <Link
        href="/app/prode/predicciones"
        role="tab"
        aria-selected={isSpecial}
        className={tabClass(isSpecial)}
      >
        Especial
      </Link>
    </div>
  );
}
