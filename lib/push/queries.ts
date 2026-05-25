import { createAdminClient } from "@/lib/supabase/admin";

export interface PushSub {
  id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

export async function getSubscriptionsForUser(userId: string): Promise<PushSub[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("push_subscription")
    .select("id, endpoint, p256dh_key, auth_key")
    .eq("user_id", userId);
  return (data ?? []) as PushSub[];
}

export async function removeStaleSubscription(endpoint: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("push_subscription").delete().eq("endpoint", endpoint);
}
