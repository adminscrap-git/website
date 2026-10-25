"use client";

import { useActionState } from "react";
import { agentSignIn } from "@/app/actions/field";
import type { FormState } from "@/app/actions/field";

const field =
  "w-full rounded-sm border-2 border-paper-3 bg-paper px-4 py-3.5 text-lg font-semibold " +
  "focus:border-cobalt focus:outline-none";

export function AgentLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(agentSignIn, {});

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />

      <label className="block">
        <span className="readout text-[11px] uppercase tracking-[0.14em] text-ink-2">
          Email
        </span>
        <input
          name="email"
          type="email"
          // Echoed back by the action: React empties an uncontrolled form once
          // the action returns, and an empty required box makes the next tap
          // on Sign in do nothing.
          defaultValue={state.values?.email}
          key={state.values?.email}
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          required
          className={`mt-1.5 ${field}`}
        />
      </label>

      <label className="block">
        <span className="readout text-[11px] uppercase tracking-[0.14em] text-ink-2">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={`mt-1.5 ${field}`}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-coral px-6 py-4 text-lg font-extrabold text-ink border-b-[5px] border-coral-deep active:translate-y-[5px] active:border-b-0 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {state.error && (
        <p className="rounded-sm bg-coral-soft px-4 py-3 text-base font-bold text-coral-deep">
          {state.error}
        </p>
      )}
    </form>
  );
}
