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
  const response = NextResponse.next({ request: { headers: request.headers } });

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin config de Supabase NO podemos validar sesión.
  // AUTH-001: fallo cerrado — rutas protegidas (/app/*) redirigen al login en vez
  // de dejar pasar sin autenticación. Las rutas públicas (login, register, etc.)
  // siguen pasando para no romper el acceso al sitio si la config es temporal.
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    const { pathname } = request.nextUrl;
    if ((pathname.startsWith("/app") || pathname === "/") && pathname !== "/splash") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
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
    });

    // `getUser()` valida el JWT contra el auth server; puede fallar de formas que
    // NO son un "deslogueado" limpio (refresh token vencido, JWT con sub de un
    // user borrado). A veces el auto-refresh LANZA en vez de devolver error → por
    // eso el try interno. Cualquier cosa que no sea user válido = deslogueado.
    let hasValidUser = false;
    let authError: unknown = null;
    try {
      const { data, error } = await supabase.auth.getUser();
      hasValidUser = !error && !!data?.user;
      authError = error;
    } catch (e) {
      authError = e;
    }

    const { pathname } = request.nextUrl;
    const isAppRoute = pathname.startsWith("/app") || pathname === "/";
    const isAuthRoute =
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot");

    if (isAppRoute && !hasValidUser && pathname !== "/splash") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      const redirectResponse = NextResponse.redirect(url);
      // Purga cookies sb-*-auth-token muertas para no rebotar en cada request.
      if (authError) {
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
  } catch {
    // Blindaje final: ante CUALQUIER fallo del middleware, AUTH-001:
    // rutas protegidas → redirigir al login (antes: fail-open, cualquier error
    // dejaba entrar sin autenticación). Rutas públicas → dejar pasar.
    const { pathname } = request.nextUrl;
    if ((pathname.startsWith("/app") || pathname === "/") && pathname !== "/splash") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }
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
