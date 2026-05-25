/**
 * O2 PRODE — (app) route group layout
 * Wraps Home, Prode, Ranking, Muro, Perfil with persistent BottomNav.
 */

import { BottomNav } from "@/components/features/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-container">
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
