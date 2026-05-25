import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface SubscribeBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json()) as SubscribeBody;
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  await supabase.from("push_subscription").upsert(
    {
      user_id: user.id,
      endpoint: body.endpoint,
      p256dh_key: body.keys.p256dh,
      auth_key: body.keys.auth,
      user_agent: req.headers.get("user-agent") ?? undefined,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" },
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { endpoint } = (await req.json()) as { endpoint: string };
  if (!endpoint) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  await supabase
    .from("push_subscription")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  return NextResponse.json({ ok: true });
}
