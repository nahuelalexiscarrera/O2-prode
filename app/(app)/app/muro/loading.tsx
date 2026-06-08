import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

export default function MuroLoading() {
  return (
    <div className={cn("min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col")}>
      {/* Header */}
      <div className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>

      <div className="flex flex-col gap-4 px-4 pt-2">
        {/* Tabs */}
        <div className="flex gap-1">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>

        {/* Composer skeleton */}
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3">
          <div className="flex gap-3">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <Skeleton className="flex-1 h-16 rounded-lg" />
          </div>
          <div className="flex justify-end border-t border-border pt-3">
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>

        {/* Post cards */}
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex flex-col gap-1 flex-1">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </div>
            <Skeleton className="mx-4 h-12 rounded-lg mb-3" />
            <div className="flex gap-5 px-4 py-2 border-t border-border">
              <Skeleton className="h-6 w-10 rounded" />
              <Skeleton className="h-6 w-10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
