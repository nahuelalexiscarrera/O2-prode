import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

export default function RankingLoading() {
  return (
    <div className={cn("min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col")}>
      {/* Header skeleton */}
      <div className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>

      {/* Podium skeleton */}
      <div className="flex items-end justify-center gap-2 px-4 py-4">
        {/* 2nd place */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="w-full h-[72px] rounded-t-lg" />
        </div>
        {/* 1st place */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="w-full h-24 rounded-t-lg" />
        </div>
        {/* 3rd place */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="w-full h-[60px] rounded-t-lg" />
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-border" />

      {/* Ranking rows */}
      <div className="flex flex-col">
        {(["r1","r2","r3","r4","r5","r6","r7","r8","r9","r10"] as const).map((k) => (
          <div key={k} className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
            <Skeleton className="h-4 w-6 rounded" />
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="h-4 w-10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
