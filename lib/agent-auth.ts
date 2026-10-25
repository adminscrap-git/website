import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sbSession } from "@/lib/supabase/server";
import { sbAdmin } from "@/lib/supabase/admin";
import type { AgentProfile } from "@/lib/db-types";

/**
 * Who is signed in to /agent.
 *
 * Mirrors lib/admin-auth.ts and shares nothing with it on purpose. An agent
 * holds a row in `agent_profiles`; an admin holds one in `admin_profiles`.
 * Neither table knows about the other, so there is no role argument anywhere
 * that could be forgotten and hand a field phone the back office.
 *
 * `is_active` is checked here rather than at login: deactivating an agent must
 * take effect on their next request, not whenever their session happens to
 * expire. Someone who has left should lose the customer list immediately.
 */
export const currentAgent = cache(async (): Promise<AgentProfile | null> => {
  const sb = await sbSession();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sbAdmin()
    .from("agent_profiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle<AgentProfile>();

  return data ?? null;
});

/** Gate for /agent pages. */
export async function requireAgent(): Promise<AgentProfile> {
  const agent = await currentAgent();
  if (!agent) redirect("/agent/login");
  return agent;
}

/** Same check for server actions, which must not redirect. */
export async function assertAgent(): Promise<
  { ok: true; agent: AgentProfile } | { ok: false; error: string }
> {
  const agent = await currentAgent();
  if (!agent) {
    return { ok: false, error: "You're signed out. Reload and sign in again." };
  }
  return { ok: true, agent };
}

/**
 * Confirms this agent is the one carrying this booking.
 *
 * Every agent action takes a booking id from the client, so ownership has to
 * be proved server-side on each one — otherwise any signed-in agent could
 * post photos and payment figures onto anybody's job by changing the id.
 */
export async function assertAssigned(
  bookingId: string,
): Promise<
  { ok: true; agent: AgentProfile } | { ok: false; error: string }
> {
  const auth = await assertAgent();
  if (!auth.ok) return auth;

  const { data } = await sbAdmin()
    .from("bookings")
    .select("assigned_agent_id")
    .eq("id", bookingId)
    .maybeSingle<{ assigned_agent_id: string | null }>();

  if (!data) return { ok: false, error: "That booking no longer exists." };
  if (data.assigned_agent_id !== auth.agent.user_id) {
    return { ok: false, error: "That job isn't assigned to you." };
  }
  return { ok: true, agent: auth.agent };
}
