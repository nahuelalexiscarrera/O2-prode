import { timingSafeEqual } from "node:crypto";
import { evaluateMatchSettledForUsers } from "@/lib/achievements/match-settled";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET ?? "";
  const provided = Buffer.from(auth.replace("Bearer ", ""));
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected))
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: users, error } = await admin.from("user").select("id").is("deleted_at", null);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const ids = (users ?? []).map((u) => u.id as string);
  await evaluateMatchSettledForUsers(ids);

  return Response.json({ ok: true, evaluated: ids.length });
}
