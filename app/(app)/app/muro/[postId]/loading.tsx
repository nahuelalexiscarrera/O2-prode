import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

export default function PostDetailLoading() {
  return (
    <div className={cn("min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col")}>
      {/* Header */}
      <div className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <Skeleton className="h-7 w-32 rounded-lg" />
      </div>

      <div className="flex flex-col gap-4 px-4 pt-2">
        {/* Post card */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex flex-col gap-1 flex-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
          <div className="px-4 pb-3 flex flex-col gap-1.5">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-3/5 rounded" />
          </div>
          <div className="flex gap-5 px-4 py-2 border-t border-border">
            <Skeleton className="h-6 w-10 rounded" />
            <Skeleton className="h-6 w-10 rounded" />
          </div>
        </div>

        {/* Comments section label */}
        <Skeleton className="h-3 w-24 rounded" />

        {/* Comment cards */}
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-3 bg-card rounded-xl border border-border p-4">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
          </div>
        ))}

        {/* Comment compose */}
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="flex justify-end border-t border-border pt-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
