/**
 * O2 PRODE — Reporte de errores del lado del cliente (browser-only).
 *
 * Dedup por sesión: cada error se manda UNA vez por carga de página (un loop de
 * render que tira 1000 errores → 1 solo POST). Filtra ruido antes de enviar.
 * Fire-and-forget vía sendBeacon (no bloquea ni rompe la UX).
 */

const NOISE: RegExp[] = [
  /resizeobserver/i,
  /^script error\.?$/i,
  /failed to fetch|networkerror|load failed|network connection was lost|aborterror/i,
  /loading chunk \d+ failed|chunkloaderror|importing a module script failed|failed to fetch dynamically imported module/i,
  /chrome-extension:\/\/|moz-extension:\/\//i,
];

const sentThisSession = new Set<string>();

export function reportClientError(message: string, stack?: string | null): void {
  try {
    if (typeof window === "undefined") return;
    const msg = String(message ?? "").slice(0, 2000);
    if (!msg || NOISE.some((re) => re.test(msg))) return;

    const key = msg.slice(0, 200);
    if (sentThisSession.has(key)) return;
    sentThisSession.add(key);

    const body = JSON.stringify({
      kind: "client",
      message: msg,
      stack: stack ? String(stack).slice(0, 8000) : null,
      route: window.location?.pathname ?? null,
    });
    const url = "/api/report-error";

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      void fetch(url, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // nunca propaga
  }
}
