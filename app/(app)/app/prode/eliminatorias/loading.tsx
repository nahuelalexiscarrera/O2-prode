import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

export default function EliminatoriasLoading() {
  return (
    <div className={cn("min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col gap-4")}>
      {/* Header skeleton */}
      <div className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 px-4">
        <Skeleton className="h-9 flex-1 rounded-full" />
        <Skeleton className="h-9 flex-1 rounded-full" />
      </div>

      {/* Phase cards */}
      <div className="flex flex-col gap-4 px-4">
        {["r32", "r16", "qf", "sf", "final"].map((p) => (
          <Skeleton key={p} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
