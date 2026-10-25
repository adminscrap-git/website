import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next 16 renamed `middleware` to `proxy` (nodejs runtime, not edge).
 *
 * Two jobs, both cheap:
 *  1. Refresh the Supabase session and write the rotated cookies onto the
 *     response. Server Components can't set cookies, so if this doesn't happen
 *     here, admins get logged out at random.
 *  2. Bounce anonymous requests away from /admin before any page renders.
 *
 * This checks *authentication* only. Whether that user is actually an admin,
 * and what role they hold, is decided in lib/admin-auth.ts — a Supabase auth
 * user with no admin_profiles row gets nothing.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Before Supabase is configured there is no session to check. Let the request
  // through so the page renders the app's own setup error, rather than crashing
  // in here and returning an opaque 500 with nothing to act on.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          // Responses that set auth cookies must never be cached by a CDN,
          // or one admin's session gets served to another.
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Two areas, two sign-ins. Everything here is about bouncing an anonymous
  // request to the right one. WHICH of the two a signed-in user actually
  // belongs to is decided by lib/admin-auth.ts and lib/agent-auth.ts against
  // their own tables — this only proves somebody is logged in at all.
  const area = pathname.startsWith("/agent") ? "/agent" : "/admin";
  const loginPath = `${area}/login`;
  const isLogin = pathname === loginPath;

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    url.search = pathname === area ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = area;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/agent/:path*"],
};
