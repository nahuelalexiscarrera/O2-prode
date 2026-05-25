"use client";

import { useState, useEffect, useTransition } from "react";
import { Switch } from "@/components/ui/Switch";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const array = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    array[i] = rawData.charCodeAt(i);
  }
  return array;
}

export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }
    setSupported(true);
    if (Notification.permission === "denied") {
      setBlocked(true);
      return;
    }
    void checkSubscription();
  }, []);

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      // SW todavía no activo
    }
  }

  function handleToggle(value: boolean) {
    startTransition(async () => {
      if (value) await subscribe();
      else await unsubscribe();
    });
  }

  async function subscribe() {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      if (perm === "denied") setBlocked(true);
      return;
    }
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const json = sub.toJSON();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
      }),
    });
    setSubscribed(true);
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) {
      setSubscribed(false);
      return;
    }
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
    setSubscribed(false);
  }

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-3">
        <span className="text-body-sm text-text font-medium">Notificaciones push</span>
        <span className="text-[11px] text-text-muted">
          {blocked
            ? "Bloqueadas en tu navegador — habilitá desde ajustes del sitio"
            : "Avisos en tiempo real en tu dispositivo"}
        </span>
      </div>
      <Switch checked={subscribed} onChange={handleToggle} disabled={isPending || blocked} />
    </div>
  );
}
