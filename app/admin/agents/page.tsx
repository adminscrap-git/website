import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sbAdmin } from "@/lib/supabase/admin";
import { site } from "@/lib/site";
import type { AgentProfile } from "@/lib/db-types";
import { NewAgentForm, AgentRow } from "@/components/admin/agent-forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pickup agents" };

/**
 * Agent accounts.
 *
 * super_admin only — an agent account is a working login into customer
 * addresses and phone numbers, and minting one should sit with whoever owns
 * the business, not with everyone who can work a booking.
 */
export default async function AgentsPage() {
  await requireAdmin("super_admin");

  const { data } = await sbAdmin()
    .from("agent_profiles")
    .select("*")
    .order("is_active", { ascending: false })
    .order("full_name")
    .returns<AgentProfile[]>();

  const agents = data ?? [];
  const active = agents.filter((a) => a.is_active);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <h1 className="display text-4xl">Pickup agents</h1>
      <p className="mt-2 text-base font-semibold text-ink-2">
        {active.length} active. They sign in at{" "}
        <span className="readout text-ink">{site.url}/agent</span> with the email
        and password you set here.
      </p>

      <NewAgentForm />

      <h2 className="readout mt-12 text-[11px] uppercase tracking-[0.16em] text-ink-3">
        Everyone
      </h2>

      {agents.length === 0 ? (
        <p className="mt-4 rounded-toy bg-paper-2 p-8 text-center text-lg font-bold text-ink-2">
          No agents yet. Add one above.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {agents.map((a) => (
            <AgentRow key={a.user_id} agent={a} />
          ))}
        </ul>
      )}
    </div>
  );
}
