/**
 * GET /api/share/[template]/[userId]?format=story|square&contextId=<uuid>
 *
 * Generates a share PNG using @vercel/og (Satori).
 * Fonts: place Anton-Regular.ttf + Inter-Bold.ttf in /public/fonts/ for production.
 * Fallback: Satori uses system monospace if fonts are not available.
 */

import { ImageResponse } from "@vercel/og";
import { type NextRequest } from "next/server";
import { fetchShareData } from "@/lib/share/dataFetchers";
import { renderTemplate } from "@/lib/share/render";
import { verifyShareToken } from "@/lib/share/sign";
import type { ShareFormat, ShareTemplateId } from "@/lib/share/templates";

export const runtime = "edge";

const VALID_TEMPLATES = new Set(["summary", "position", "match", "achievement"]);

// ─── Rate limiting por IP (API-002 / IDOR-001) ─────────────────────────────
// El share endpoint es intencionalmente público para el flujo viral (el PNG se
// embebe en Instagram Stories, WhatsApp, etc. — no puede requerir auth).
// Sin rate limiting, un atacante podría enumerar todos los userId de la DB y
// descargar tarjetas de ~800 socios en segundos.
// Límite: 40 req / 5 min por IP → suficiente para compartir (1 req/template),
// demasiado poco para enumerar el padrón completo.
// Nota: en edge functions, este Map es per-instance; en entornos multi-instance
// (Vercel prodution) el límite aplica por instancia. Esto es una primera línea
// de defensa razonable sin infra adicional (Redis no disponible en edge).

type Bucket = { count: number; resetAt: number };
const ipBuckets = new Map<string, Bucket>();
const RL_MAX = 40;
const RL_WINDOW_MS = 5 * 60 * 1000; // 5 minutos

function ipRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RL_MAX) return false;
  bucket.count++;
  return true;
}

async function tryFetchFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ template: string; userId: string }> }
) {
  // Rate limit check antes de cualquier procesamiento costoso.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!ipRateLimit(ip)) {
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": "300" },
    });
  }

  const { template, userId } = await params;
  const { searchParams } = request.nextUrl;
  const format: ShareFormat =
    searchParams.get("format") === "square" ? "square" : "story";
  const contextId = searchParams.get("contextId") ?? undefined;
  const sig = searchParams.get("sig") ?? undefined;

  if (!VALID_TEMPLATES.has(template)) {
    return new Response("Invalid template", { status: 400 });
  }

  // El dueño firma su share (token HMAC) → puede revelar su predicción aunque el
  // partido no haya arrancado. Sin token válido, fetchShareData mantiene la regla
  // del kickoff (anti-espionaje). HMAC local → rápido, no vale paralelizar.
  const authorizedReveal = await verifyShareToken(userId, contextId, sig);

  const dims =
    format === "story" ? { width: 1080, height: 1920 } : { width: 1080, height: 1080 };

  // Fetch fonts and share data in parallel.
  // Fonts loaded from /public/fonts/ (must be placed there for production).
  const origin = new URL("/", request.url).origin;
  const [antonData, interData, shareData] = await Promise.all([
    tryFetchFont(`${origin}/fonts/Anton-Regular.ttf`),
    tryFetchFont(`${origin}/fonts/Inter-Bold.ttf`),
    fetchShareData(template as ShareTemplateId, userId, contextId, authorizedReveal),
  ]);

  if (!shareData) {
    return new Response("Data not found", { status: 404 });
  }

  const fonts: NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"] = [];
  if (antonData) fonts.push({ name: "Anton", data: antonData, style: "normal", weight: 400 });
  if (interData) fonts.push({ name: "Inter", data: interData, style: "normal", weight: 700 });

  const jsx = renderTemplate(shareData, format, origin);

  return new ImageResponse(jsx, {
    ...dims,
    fonts,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "Cache-Tag": `user-${userId}`,
    },
  });
}
