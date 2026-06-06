/**
 * O2 PRODE — Supabase server client
 * For use in Server Components, Route Handlers and Server Actions.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Acceso por BRACKET a propósito: Next inyecta en build solo `process.env.NEXT_PUBLIC_X`
// (dot). Con bracket NO se hornea → se lee del runtime, igual que el middleware. Así
// el server-side de Supabase anda mientras el env esté en Vercel (runtime), sin
// depender de que estuviera presente en el momento exacto del build.
function supabaseEnv() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  return { url, key };
}

export async function createClient() {
  const { url, key } = supabaseEnv();
  if (!url || !key) {
    throw new Error(
      "Supabase mal configurado: faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "en las Environment Variables de Vercel (Production)."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Components can't set cookies; safely ignore.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // ignore
          }
        },
      },
    }
  );
}
