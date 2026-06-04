import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/users/queries";
import { getMatchesForAdmin } from "@/lib/admin/queries";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { MatchResultManager } from "@/components/features/MatchResultManager";

export const dynamic = "force-dynamic";

export default async function AdminPartidosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  if (!(await getIsAdmin())) notFound();

  const matches = await getMatchesForAdmin();

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col">
      <ScreenHeader title="Resultados" backHref="/app/admin" />
      <p className="px-4 pt-2 pb-4 text-body-sm text-text-muted">
        Cargá el resultado final de cada partido. Al guardar se calculan los puntos de todas las
        predicciones y se actualiza el ranking automáticamente.
      </p>
      <MatchResultManager matches={matches} />
    </div>
  );
}
