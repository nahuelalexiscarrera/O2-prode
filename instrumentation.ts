/**
 * O2 PRODE — Next.js instrumentation.
 *
 * onRequestError es el hook oficial de Next 15 para capturar errores
 * server-side (RSC, route handlers, server actions) de forma central. Lo
 * canalizamos a la auto-captura deduplicada (kind: "server").
 */

export function register(): void {
  // No-op: solo usamos onRequestError por ahora.
}

export async function onRequestError(
  err: unknown,
  request: { path?: string },
  context: { routePath?: string },
): Promise<void> {
  try {
    const { recordError } = await import("@/lib/errors/record");
    const e = err as { message?: string; stack?: string } | null;
    await recordError({
      kind: "server",
      message: e?.message ?? String(err),
      stack: e?.stack ?? null,
      route: context?.routePath ?? request?.path ?? null,
    });
  } catch {
    // nunca propaga
  }
}
