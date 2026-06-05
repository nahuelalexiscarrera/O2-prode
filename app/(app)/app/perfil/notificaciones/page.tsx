import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

// Ícono por tipo de notificación (estilo feed Twitter/FB).
const ICON_BY_TYPE: Record<string, IconName> = {
  comment: "comment",
  reaction: "heart-filled",
  "achievement-unlocked": "medal",
  "match-upcoming": "ball",
  "match-result": "ball",
  "phase-start": "nav-trophy",
  "close-to-podium": "nav-chart",
  "onboarding-incomplete": "info",
};

/** Normaliza deep links viejos (sin prefijo /app) para que sean navegables. */
function normalizeDeepLink(link: string | null): string | null {
  if (!link) return null;
  if (link.startsWith("http") || link.startsWith("/app")) return link;
  return `/app${link.startsWith("/") ? "" : "/"}${link}`;
}

export default async function NotificacionesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  const user = data.user;

  const { data: notifs } = await supabase
    .from("notification")
    .select("id, type, title, body, deep_link, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Mark all as read
  await supabase
    .from("notification")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  const items = notifs ?? [];

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col">
      <ScreenHeader title="Notificaciones" backHref="/app" />

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-body-sm text-text-muted text-center px-8">
            No tenés notificaciones todavía.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border px-4 pt-2">
          {items.map((n) => {
            const isUnread = !n.read_at;
            const date = new Date(n.created_at as string).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });
            const icon = ICON_BY_TYPE[n.type as string] ?? "bell";
            const href = normalizeDeepLink(n.deep_link as string | null);

            const inner = (
              <>
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Icon name={icon} size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-body-sm font-semibold text-text leading-snug">
                      {n.title as string}
                    </p>
                    {isUnread && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                    )}
                  </div>
                  <p className="text-[12px] text-text-muted leading-snug mt-0.5">
                    {n.body as string}
                  </p>
                  <p className="text-[10px] text-text-muted mt-1">{date}</p>
                </div>
              </>
            );

            const rowClass = cn(
              "flex gap-3 py-4 -mx-4 px-4 transition-colors",
              href && "hover:bg-card active:bg-card",
              !isUnread && "opacity-60"
            );

            return href ? (
              <Link key={n.id as string} href={href} className={rowClass}>
                {inner}
              </Link>
            ) : (
              <div key={n.id as string} className={rowClass}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
