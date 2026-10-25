import "server-only";
import type { TemplateKey } from "@/lib/notify";

/**
 * WhatsApp Cloud API, direct to Meta.
 *
 * Everything here is finished except the credentials. With the three env vars
 * set it sends; without them `metaDriver()` returns null and the outbox keeps
 * queueing, which is the same code path either way.
 *
 * Two Meta facts shape this file:
 *
 * 1. A business-initiated message must be a pre-approved TEMPLATE. We never
 *    reply inside a 24-hour service window — every message we send is us
 *    starting the conversation — so this only ever sends templates and never
 *    free-form text. That removes a whole class of "works in testing, fails in
 *    production the next day" bugs.
 *
 * 2. Approved templates carry POSITIONAL placeholders ({{1}}, {{2}}), not our
 *    named ones. REGISTRY below is the translation, and its `params` arrays are
 *    the contract with what you registered in Meta's console. Get the order
 *    wrong and the customer is told the wrong date with no error anywhere.
 */

const GRAPH_VERSION = "v21.0";

type MetaConfig = {
  token: string;
  phoneNumberId: string;
  language: string;
};

export function metaConfig(): MetaConfig | null {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  return {
    token,
    phoneNumberId,
    // Must match the language the template was approved under, exactly.
    // "en" and "en_US" are different templates to Meta.
    language: process.env.WHATSAPP_TEMPLATE_LANG || "en",
  };
}

/**
 * Our template key → the template you register with Meta.
 *
 * `name` defaults to our own key, so if you register them under exactly these
 * names nothing needs changing. `params` is the order the {{n}} placeholders
 * appear in the approved body.
 */
export const REGISTRY: Record<TemplateKey, { name: string; params: string[] }> = {
  booking_confirmed_customer: {
    name: "booking_confirmed_customer",
    params: ["name", "code", "date", "slot", "items", "track"],
  },
  booking_new_admin: {
    name: "booking_new_admin",
    params: ["code", "name", "phone", "date", "slot", "address", "items", "estimate"],
  },
  agent_assigned_customer: {
    name: "agent_assigned_customer",
    params: ["name", "agentName", "code", "date", "slot", "agentPhone", "track"],
  },
  agent_en_route_customer: {
    name: "agent_en_route_customer",
    params: ["name", "agentName", "code", "track"],
  },
  agent_at_gate_customer: {
    name: "agent_at_gate_customer",
    params: ["name", "agentName", "code", "agentPhone"],
  },
  pickup_complete_customer: {
    name: "pickup_complete_customer",
    params: ["name", "code", "weight", "amount", "method", "track"],
  },
  job_assigned_agent: {
    name: "job_assigned_agent",
    params: ["code", "date", "slot", "name", "phone", "address"],
  },
};

/**
 * Meta rejects a parameter containing a newline, a tab, or four or more
 * consecutive spaces — with a generic error that does not say which one.
 * Cheaper to make every value safe than to debug that at 9pm.
 */
function safeParam(value: string): string {
  const flat = String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{4,}/g, "   ")
    .trim();
  // 1024 is the per-parameter ceiling.
  return (flat || "-").slice(0, 1024);
}

export type SendResult = { id?: string };

/**
 * Sends one template message.
 *
 * Throws on anything that is not a 2xx, with Meta's own message attached —
 * the outbox records it against the row and retries, so the text of the error
 * is the only thing that makes a failure diagnosable later.
 */
export async function sendTemplate(
  cfg: MetaConfig,
  to: string,
  templateKey: TemplateKey,
  vars: Record<string, unknown>,
): Promise<SendResult> {
  const entry = REGISTRY[templateKey];
  if (!entry) throw new Error(`No Meta template registered for ${templateKey}`);

  const parameters = entry.params.map((key) => ({
    type: "text" as const,
    text: safeParam(String(vars[key] ?? "")),
  }));

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${cfg.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: entry.name,
          language: { code: cfg.language },
          components: parameters.length
            ? [{ type: "body", parameters }]
            : [],
        },
      }),
      // A hung Meta request must not hold a server action open indefinitely.
      signal: AbortSignal.timeout(15_000),
    },
  );

  const json: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = (json as { error?: { message?: string; code?: number } }).error;
    throw new Error(
      `Meta ${res.status}${err?.code ? ` (${err.code})` : ""}: ${
        err?.message ?? "unknown error"
      }`,
    );
  }

  const id = (json as { messages?: { id?: string }[] }).messages?.[0]?.id;
  return { id };
}

/**
 * The text we store and show in the admin outbox.
 *
 * Meta renders the approved body from the parameters, so what the customer
 * actually receives is decided at Meta's end, not here. This stays the local
 * preview and the one-tap manual fallback — which is why the two are allowed
 * to drift in wording without breaking sending.
 */
export function describeTemplate(templateKey: TemplateKey): string {
  return REGISTRY[templateKey]?.name ?? templateKey;
}
