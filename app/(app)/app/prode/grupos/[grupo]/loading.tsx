import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

export default function GroupStageLoading() {
  return (
    <div className={cn("min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col gap-4")}>
      {/* Header skeleton */}
      <div className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <Skeleton className="h-7 w-32 rounded-lg" />
      </div>

      {/* Chip bar skeleton */}
      <div className="flex gap-2 px-4 overflow-hidden">
        {["a", "b", "c", "d", "e", "f"].map((g) => (
          <Skeleton key={g} className="h-8 w-10 rounded-full shrink-0" />
        ))}
      </div>

      {/* Match card skeletons */}
      <div className="flex flex-col gap-3 px-4">
        {["m1", "m2", "m3"].map((m) => (
          <div key={m} className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3">
            <Skeleton className="h-4 w-24 rounded" />
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex gap-3">
                <Skeleton className="h-20 w-16 rounded-lg" />
                <Skeleton className="h-20 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-16 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
