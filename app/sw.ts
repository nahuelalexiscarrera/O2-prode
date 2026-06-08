import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { defaultCache } from "@serwist/next/worker";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const { title, body, deep_link, tag } = event.data.json() as {
    title: string;
    body: string;
    deep_link?: string;
    tag?: string;
  };
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      // tag agrupa: mismas categorías se reemplazan en vez de apilarse (B6).
      // renotify vuelve a avisar aunque reemplace una notificación previa.
      tag: tag ?? "o2-prode",
      renotify: true,
      data: { url: deep_link ?? "/app" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = (event.notification.data as { url?: string })?.url ?? "/app";
  // XSS-001: validar que la URL es una ruta relativa del propio origen antes de
  // navegar. Un payload de push malicioso podría incluir una URL externa para
  // redirigir al usuario a un sitio de phishing vía client.navigate().
  // Todas las deep_links de O2 PRODE son rutas relativas (empiezan con "/").
  const url = rawUrl.startsWith("/") ? rawUrl : "/app";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("navigate" in client && "focus" in client) {
            void (client as WindowClient).navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});

serwist.addEventListeners();
