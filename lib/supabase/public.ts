import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database";

function env(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill in your Supabase project values.`,
    );
  }
  return v;
}

/**
 * Anon client for public catalogue reads (categories, items, slots, pincodes).
 *
 * Safe to reuse across requests: it carries no session and RLS restricts it to
 * active catalogue rows. Bookings are unreachable from here by design — those
 * go through lib/supabase/admin.ts inside server actions.
 */
let cached: ReturnType<typeof createClient<Database>> | null = null;

export function sbPublic() {
  cached ??= createClient<Database>(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return cached;
}
