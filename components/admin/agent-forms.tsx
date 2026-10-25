"use client";

import { useActionState, useState } from "react";
import {
  createAgent,
  updateAgent,
  setAgentActive,
  resetAgentPassword,
  deleteAgent,
} from "@/app/actions/agents";
import type { FormState } from "@/app/actions/agents";
import type { AgentProfile } from "@/lib/db-types";
import { AdminField, FormMessage, SubmitButton, adminInput, Panel } from "./ui";

/**
 * Creating an agent sets a password on the spot rather than emailing an
 * invite. These are work accounts handed over in person — an invite link to an
 * address the agent may not even control is a worse flow and a worse secret.
 */
export function NewAgentForm() {
  const [state, action] = useActionState<FormState, FormData>(createAgent, {});

  return (
    <Panel title="Add an agent">
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Full name">
          <input name="full_name" required className={adminInput} placeholder="Ravi Kumar" />
        </AdminField>

        <AdminField label="Mobile" hint="Optional. Used to send them their jobs.">
          <input
            name="phone"
            inputMode="numeric"
            className={adminInput}
            placeholder="98765 43210"
          />
        </AdminField>

        <AdminField label="Sign-in email">
          <input
            name="email"
            type="email"
            autoCapitalize="none"
            required
            className={adminInput}
            placeholder="ravi@scrapsquad.in"
          />
        </AdminField>

        <AdminField label="Password" hint="At least 8 characters. Write it down for them.">
          <input
            name="password"
            type="text"
            minLength={8}
            required
            className={adminInput}
            autoComplete="off"
          />
        </AdminField>

        <div className="sm:col-span-2">
          <SubmitButton pendingLabel="Creating…">Create agent</SubmitButton>
          <FormMessage state={state} />
        </div>
      </form>
    </Panel>
  );
}

export function AgentRow({ agent }: { agent: AgentProfile }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-toy border-2 border-paper-3 bg-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-extrabold leading-tight">
            {agent.full_name}
            {!agent.is_active && (
              <span className="readout ml-2 rounded-full bg-paper-3 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-ink-2">
                Inactive
              </span>
            )}
          </p>
          <p className="readout mt-1 text-xs text-ink-3">
            {agent.email}
            {agent.phone ? ` · ${agent.phone}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-sm font-bold text-cobalt underline underline-offset-4"
        >
          {open ? "Close" : "Manage"}
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-5 border-t-2 border-paper-3 pt-5">
          <EditForm agent={agent} />
          <PasswordForm agent={agent} />
          <DangerRow agent={agent} />
        </div>
      )}
    </li>
  );
}

function EditForm({ agent }: { agent: AgentProfile }) {
  const [state, action] = useActionState<FormState, FormData>(updateAgent, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="user_id" value={agent.user_id} />
      <AdminField label="Full name">
        <input name="full_name" defaultValue={agent.full_name} className={adminInput} />
      </AdminField>
      <AdminField label="Mobile">
        <input name="phone" defaultValue={agent.phone ?? ""} className={adminInput} />
      </AdminField>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

function PasswordForm({ agent }: { agent: AgentProfile }) {
  const [state, action] = useActionState<FormState, FormData>(resetAgentPassword, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="user_id" value={agent.user_id} />
      <div className="min-w-[220px] flex-1">
        <AdminField label="New password" hint="They will not be told automatically.">
          <input
            name="password"
            type="text"
            minLength={8}
            required
            autoComplete="off"
            className={adminInput}
          />
        </AdminField>
      </div>
      <SubmitButton pendingLabel="Changing…">Change password</SubmitButton>
      <div className="w-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

/**
 * Deactivate is the ordinary control and is listed first. Deleting destroys
 * the record of who collected every past pickup, so it asks twice.
 */
function DangerRow({ agent }: { agent: AgentProfile }) {
  const [activeState, activeAction] = useActionState<FormState, FormData>(setAgentActive, {});
  const [delState, delAction] = useActionState<FormState, FormData>(deleteAgent, {});
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={activeAction}>
        <input type="hidden" name="user_id" value={agent.user_id} />
        <input type="hidden" name="active" value={agent.is_active ? "false" : "true"} />
        <SubmitButton pendingLabel="Saving…" variant="quiet">
          {agent.is_active ? "Deactivate" : "Reactivate"}
        </SubmitButton>
      </form>

      {confirming ? (
        <form action={delAction} className="flex items-center gap-2">
          <input type="hidden" name="user_id" value={agent.user_id} />
          <span className="text-sm font-bold text-coral-deep">
            Delete permanently? Past pickups lose their agent.
          </span>
          <SubmitButton pendingLabel="Deleting…" variant="danger">
            Yes, delete
          </SubmitButton>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-sm font-bold underline underline-offset-4"
          >
            Keep
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm font-bold text-ink-3 underline underline-offset-4"
        >
          Delete
        </button>
      )}

      <div className="w-full">
        <FormMessage state={activeState} />
        <FormMessage state={delState} />
      </div>
    </div>
  );
}
