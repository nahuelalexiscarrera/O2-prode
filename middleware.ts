/**
 * O2 PRODE — Edge middleware (auth gate)
 * Agente 7 · Next.js Architect
 *
 * Guards all routes under /app/** by checking Supabase auth cookie.
 * Refreshes session if near expiry. Redirects to /login if missing.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // `getUser()` validates the JWT against the auth server, so it can fail in
  // ways that are NOT a clean "logged out": un refresh token vencido/inexistente
  // ("Invalid Refresh Token: Refresh Token Not Found"), o — el caso que nos pegó
  // en beta — un JWT cuyo `sub` apunta a un auth user borrado ("User from sub
  // claim in JWT does not exist"). En la mayoría devuelve `error`, PERO el
  // auto-refresh del token a veces LANZA (rechaza) en vez de devolver error, y
  // sin este try/catch el middleware tiraba 500 al socio con sesión vieja.
  // Cualquier cosa que no sea un usuario válido y existente = deslogueado.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  let error: unknown = null;
  try {
    const res = await supabase.auth.getUser();
    user = res.data?.user ?? null;
    error = res.error;
  } catch (e) {
    error = e;
  }
  const hasValidUser = !error && !!user;

  const { pathname } = request.nextUrl;

  // Protected routes — require auth
  const isAppRoute = pathname.startsWith("/app") || pathname === "/";

  // Auth routes — should redirect to /app if already logged in
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot");

  if (isAppRoute && !hasValidUser && pathname !== "/splash") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(url);
    // Purge stale/orphaned Supabase auth cookies so a dead session doesn't
    // bounce the user on every request — let them re-login from a clean slate.
    if (error) {
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")) {
          redirectResponse.cookies.set({ name: cookie.name, value: "", maxAge: 0, path: "/" });
        }
      }
    }
    return redirectResponse;
  }

  if (isAuthRoute && hasValidUser) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.searchParams.delete("redirect");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public files (manifest, icons, og)
     */
    "/((?!_next/static|_next/image|favicon|robots|sitemap|manifest|design|api/share).*)",
  ],
};
