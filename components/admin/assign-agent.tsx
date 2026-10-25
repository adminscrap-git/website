"use client";

import { useActionState } from "react";
import { assignAgent } from "@/app/actions/agents";
import type { FormState } from "@/app/actions/agents";
import type { AgentProfile } from "@/lib/db-types";
import { FormMessage, SubmitButton, adminInput } from "./ui";

/**
 * Puts a booking on an agent's phone.
 *
 * A plain select rather than a search: a pickup business runs a handful of
 * agents, and a combobox for six names is machinery nobody asked for. The
 * blank option is how you unassign, which is why it stays available after
 * someone is chosen.
 */
export function AssignAgent({
  bookingId,
  agents,
  current,
}: {
  bookingId: string;
  agents: AgentProfile[];
  current: string | null;
}) {
  const [state, action] = useActionState<FormState, FormData>(assignAgent, {});

  if (agents.length === 0) {
    return (
      <p className="text-sm font-semibold text-ink-2">
        No active agents yet. Add one under Pickup agents first.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="booking_id" value={bookingId} />
      <select
        name="agent_id"
        defaultValue={current ?? ""}
        className={`${adminInput} max-w-xs`}
        aria-label="Pickup agent"
      >
        <option value="">— Nobody —</option>
        {agents.map((a) => (
          <option key={a.user_id} value={a.user_id}>
            {a.full_name}
          </option>
        ))}
      </select>

      <SubmitButton pendingLabel="Assigning…">Assign</SubmitButton>

      <p className="w-full text-xs font-semibold text-ink-3">
        Assigning messages the customer with the agent&apos;s name and number,
        and messages the agent their job.
      </p>
      <div className="w-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
