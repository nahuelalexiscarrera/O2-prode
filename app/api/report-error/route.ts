/**
 * POST /api/report-error — recibe errores del cliente (público, endurecido).
 *
 * Anti-abuso/sobrecarga: rate-limit por instancia, caps de tamaño, filtro de
 * ruido y dedup en DB. Siempre responde 204 (fire-and-forget, no filtra info).
 */

import { type NextRequest, NextResponse } from "next/server";
import { recordError, isNoise } from "@/lib/errors/record";

export const runtime = "nodejs";

// Rate-limit best-effort por instancia serverless (la dedup real está en la DB).
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now - e.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  e.n++;
  return e.n > 60; // máx 60 reportes/min por IP por instancia
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (rateLimited(ip)) return new NextResponse(null, { status: 204 });

    const body = (await req.json().catch(() => null)) as
      | { kind?: unknown; message?: unknown; stack?: unknown; route?: unknown }
      | null;
    if (!body || typeof body.message !== "string") {
      return new NextResponse(null, { status: 204 });
    }

    const message = body.message.slice(0, 2000);
    if (isNoise(message)) return new NextResponse(null, { status: 204 });

    await recordError({
      kind: body.kind === "server" ? "server" : "client",
      message,
      stack: typeof body.stack === "string" ? body.stack.slice(0, 8000) : null,
      route: typeof body.route === "string" ? body.route.slice(0, 200) : null,
    });
  } catch {
    // swallow — nunca rompe
  }
  return new NextResponse(null, { status: 204 });
}
