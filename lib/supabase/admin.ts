/**
 * Supabase admin client — server-only, bypasses RLS.
 * Use only from API routes / server actions that need elevated access.
 * Never import in client components.
 */
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
