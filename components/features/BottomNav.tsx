/**
 * O2 PRODE — BottomNav
 * Spec: Agente 3 §10.10, Agente 4 §4.1
 *
 * 5 tabs persistentes en (app) routes. Glass surface.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "@/components/ui/Icon";
import { NotificationBadge } from "@/components/features/NotificationBadge";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  matchPrefix?: string;
}

const NAV: NavItem[] = [
  { href: "/app", label: "Inicio", icon: "nav-home", matchPrefix: "/app" },
  { href: "/app/prode/grupos/a", label: "Prode", icon: "nav-trophy", matchPrefix: "/app/prode" },
  { href: "/app/ranking", label: "Ranking", icon: "nav-chart", matchPrefix: "/app/ranking" },
  { href: "/app/muro", label: "Muro", icon: "nav-chat", matchPrefix: "/app/muro" },
  { href: "/app/perfil", label: "Perfil", icon: "nav-user", matchPrefix: "/app/perfil" },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.matchPrefix === "/app") return pathname === "/app";
    return pathname.startsWith(item.matchPrefix ?? item.href);
  };

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-nav glass flex justify-around py-2 pb-[calc(0.875rem+env(safe-area-inset-bottom))]"
    >
      {NAV.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center gap-1 px-3 py-1 transition-colors duration-base",
              active ? "text-primary" : "text-text-muted hover:text-text"
            )}
          >
            <Icon name={item.icon} size={22} />
            {item.matchPrefix === "/app/perfil" && <NotificationBadge />}
            <span className="text-[10px] font-semibold tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
