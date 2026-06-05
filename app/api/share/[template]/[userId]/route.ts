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
import type { ShareFormat, ShareTemplateId } from "@/lib/share/templates";

export const runtime = "edge";

const VALID_TEMPLATES = new Set(["summary", "position", "match", "achievement"]);

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
  const { template, userId } = await params;
  const { searchParams } = request.nextUrl;
  const format: ShareFormat =
    searchParams.get("format") === "square" ? "square" : "story";
  const contextId = searchParams.get("contextId") ?? undefined;

  if (!VALID_TEMPLATES.has(template)) {
    return new Response("Invalid template", { status: 400 });
  }

  const dims =
    format === "story" ? { width: 1080, height: 1920 } : { width: 1080, height: 1080 };

  // Fetch fonts and share data in parallel.
  // Fonts loaded from /public/fonts/ (must be placed there for production).
  const origin = new URL("/", request.url).origin;
  const [antonData, interData, shareData] = await Promise.all([
    tryFetchFont(`${origin}/fonts/Anton-Regular.ttf`),
    tryFetchFont(`${origin}/fonts/Inter-Bold.ttf`),
    fetchShareData(template as ShareTemplateId, userId, contextId),
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
