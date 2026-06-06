import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { ProdeTabs } from "@/components/features/ProdeTabs";
import { SpecialPredictionForm } from "@/components/features/SpecialPredictionForm";
import { cn } from "@/lib/utils/cn";

export default async function SpecialPredictionPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  const user = data.user;

  const [{ data: teams }, { data: special }, { data: firstMatch }] = await Promise.all([
    supabase.from("team").select("code, name").order("name", { ascending: true }),
    supabase
      .from("special_prediction")
      .select("champion_code, runner_up_code, group_stage_best_code, revelation_code")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("match")
      .select("kickoff_at")
      .order("kickoff_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const locked =
    firstMatch?.kickoff_at != null &&
    Date.now() >= new Date(firstMatch.kickoff_at).getTime();

  return (
    <div
      className={cn(
        "min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]",
        "flex flex-col gap-4"
      )}
    >
      <ScreenHeader title="Mi prode" />
      <ProdeTabs />
      <SpecialPredictionForm
        teams={teams ?? []}
        initial={special ?? null}
        locked={locked}
      />
    </div>
  );
}
