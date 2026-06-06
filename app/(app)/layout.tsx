/**
 * O2 PRODE — (app) route group layout
 * Wraps Home, Prode, Ranking, Muro, Perfil with persistent BottomNav.
 */

import { BottomNav } from "@/components/features/BottomNav";

// Todo el grupo (app) es contenido por-socio detrás de auth: NUNCA debe
// prerenderizarse en build (lo que ataba el build al env de Supabase y rompía
// /app/perfil/logros). force-dynamic = se renderiza por request, en runtime.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-container">
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
