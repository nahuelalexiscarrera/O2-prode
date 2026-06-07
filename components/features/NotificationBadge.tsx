"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NotificationBadge() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  // Re-cuenta los no leídos al montar y en cada cambio de ruta. Esto hace que el
  // badge se limpie al volver de /notificaciones (que marca todo leído en el
  // server), sin depender de que el evento realtime de UPDATE llegue.
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { count: unread } = await supabase
        .from("notification")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (active) setCount(unread ?? 0);
    })();
    return () => {
      active = false;
    };
  }, [pathname]);

  // Realtime: incremento en vivo cuando llega una notificación nueva.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel("notif-badge")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notification", filter: `user_id=eq.${user.id}` },
          () => setCount((c) => c + 1)
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "notification", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const row = payload.new as { read_at: string | null };
            if (row.read_at) setCount((c) => Math.max(0, c - 1));
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) void channel.unsubscribe();
    };
  }, []);

  if (count === 0) return null;

  return (
    <span
      aria-label={`${count} notificaciones sin leer`}
      className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-error text-[9px] font-bold text-white leading-none"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
