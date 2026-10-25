"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveGateByToken } from "@/app/actions/manage";
import { Button } from "@/components/ui/button";

/**
 * The customer's half of the gated-community handshake.
 *
 * The agent taps "I'm at the gate", the customer gets a message, and this is
 * where it lands: one button, on the page they already have open, that tells
 * the agent security has been told. Without it the agent is standing outside a
 * boom barrier with no idea whether anyone read the message.
 *
 * Shown only while someone is genuinely at the gate; the server re-checks that,
 * so this is convenience and not the rule.
 */
export function GateApproval({
  token,
  approvedAt,
  agentName,
}: {
  token: string;
  approvedAt: string | null;
  agentName: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (approvedAt) {
    return (
      <div className="mt-10 rounded-toy bg-cobalt-soft px-6 py-5">
        <p className="text-lg font-extrabold text-cobalt-deep">
          Entry approved — thank you.
        </p>
        <p className="mt-1 text-base font-semibold text-ink-2">
          {agentName ?? "Our agent"} has been told you&apos;ve cleared them at the
          desk.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-toy border-2 border-cobalt bg-paper-2 px-6 py-6">
      <p className="text-xl font-extrabold">
        {agentName ?? "Our agent"} is at your gate.
      </p>
      <p className="mt-1.5 text-base font-semibold text-ink-2">
        If you live in a gated community, please clear them with your security
        desk — then tap below so they know they can come up.
      </p>

      <Button
        type="button"
        className="mt-5 w-full sm:w-auto"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await approveGateByToken(token);
            if (res.ok) router.refresh();
            else setError(res.error ?? "Try that again.");
          })
        }
      >
        {pending ? "Sending…" : "I've told security — let them in"}
      </Button>

      {error && (
        <p className="mt-3 text-sm font-bold text-coral-deep">{error}</p>
      )}
    </div>
  );
}
