"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      // Initial count
      const { count: initial } = await supabase
        .from("notification")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);

      setCount(initial ?? 0);

      // Realtime — new notifications for this user
      supabase
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
            // When read_at is set, decrement
            const row = payload.new as { read_at: string | null };
            if (row.read_at) setCount((c) => Math.max(0, c - 1));
          }
        )
        .subscribe();
    }

    void init();

    return () => {
      void supabase.removeAllChannels();
    };
  }, []);

  if (count === 0) return null;

  return (
    <span
      aria-label={`${count} notificaciones sin leer`}
      className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-error text-[9px] font-bold text-white leading-none"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
