import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

export default function PerfilLoading() {
  return (
    <div className={cn("min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col")}>
      {/* Header */}
      <div className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>

      {/* Avatar + name + level */}
      <div className="flex flex-col items-center gap-3 pt-6 pb-8 px-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-4 pb-6">
        <Skeleton className="h-24 flex-1 rounded-xl" />
        <Skeleton className="h-24 flex-1 rounded-xl" />
        <Skeleton className="h-24 flex-1 rounded-xl" />
      </div>

      {/* Referral card */}
      <Skeleton className="mx-4 h-16 rounded-xl mb-4" />

      {/* Nav rows */}
      <div className="mx-4 bg-card rounded-xl border border-border overflow-hidden">
        {["logros", "notif", "config"].map((k) => (
          <div key={k} className="flex items-center justify-between px-4 py-3.5 border-b border-border last:border-b-0">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
