import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

export default function ConfiguracionLoading() {
  return (
    <div className={cn("min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col")}>
      {/* Header */}
      <div className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <Skeleton className="h-7 w-36 rounded-lg" />
      </div>

      {/* Section: Cuenta */}
      <Skeleton className="mx-4 h-3 w-14 rounded mt-5 mb-2" />
      <div className="mx-4 bg-card rounded-xl border border-border overflow-hidden">
        {["email", "pass", "avatar"].map((k) => (
          <div key={k} className="flex items-center justify-between px-4 py-3.5 border-b border-border last:border-b-0">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Section: Notificaciones */}
      <Skeleton className="mx-4 h-3 w-28 rounded mt-6 mb-2" />
      <div className="mx-4 bg-card rounded-xl border border-border overflow-hidden">
        {[1, 2, 3, 4, 5].map((k) => (
          <div key={k} className="flex items-center justify-between px-4 py-3.5 border-b border-border last:border-b-0">
            <div className="flex flex-col gap-1 flex-1 pr-4">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full shrink-0" />
          </div>
        ))}
      </div>

      {/* Section: Privacidad */}
      <Skeleton className="mx-4 h-3 w-20 rounded mt-6 mb-2" />
      <div className="mx-4 bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5">
          <Skeleton className="h-4 w-52 rounded" />
          <Skeleton className="h-6 w-10 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  );
}
