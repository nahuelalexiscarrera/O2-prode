import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/users/queries";
import { getAchievementCatalogForAdmin } from "@/lib/admin/queries";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { AchievementPointsEditor } from "@/components/features/AchievementPointsEditor";

export const dynamic = "force-dynamic";

export default async function AdminLogrosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  if (!(await getIsAdmin())) notFound();

  const achievements = await getAchievementCatalogForAdmin();

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col">
      <ScreenHeader title="Puntos de logros" backHref="/app/admin" />
      <p className="px-4 pt-2 pb-4 text-body-sm text-text-muted">
        Definí cuánto suma cada logro. Aplica a los próximos desbloqueos. Tip: los
        de posición (Top 10, Podio, Líder) van en 0 para no premiar de más al que
        ya está arriba del ranking — subilos si querés.
      </p>
      <AchievementPointsEditor achievements={achievements} />
    </div>
  );
}
