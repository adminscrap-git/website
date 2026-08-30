import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cookie-bound anon client, used only for admin auth (who is signed in).
 *
 * A fresh client per render — never share one across requests, or you leak a
 * session between users.
 */
export async function sbSession() {
  // Read cookies BEFORE anything that can throw. Touching them is what marks the
  // route dynamic, and an admin route must never be prerendered — if this threw
  // first, `next build` would try to statically render /admin and fail.
  const store = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy .env.example to .env.local and fill in your Supabase project values.",
    );
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(list) {
          try {
            for (const { name, value, options } of list) {
              store.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // proxy.ts refreshes the session on every admin request, so the
            // write this drops has already happened there.
          }
        },
      },
    },
  );
}
