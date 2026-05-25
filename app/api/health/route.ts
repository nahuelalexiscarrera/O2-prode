import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: "1.0.0",
    service: "o2-prode",
    timestamp: new Date().toISOString(),
  });
}
