import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database";

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * This is the ONLY way anything reads or writes bookings, booking_items,
 * booking_events, waitlist, settings or admin_profiles — those tables have RLS
 * on with zero policies, so no other key can touch them.
 *
 * `server-only` makes importing this from a client component a build error
 * rather than a leaked key.
 */
let cached: ReturnType<typeof createClient<Database>> | null = null;

export function sbAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Copy .env.example to .env.local and fill in your Supabase project values.",
    );
  }
  cached ??= createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
