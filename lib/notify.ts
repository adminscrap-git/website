import "server-only";
import { after } from "next/server";
import { sbAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/queries";
import { fillTemplate } from "@/lib/whatsapp";
import { normalisePhone, telHref } from "@/lib/format";
import { site } from "@/lib/site";
import type { Audience, NotificationChannel } from "@/lib/db-types";
import { metaConfig, sendTemplate } from "@/lib/whatsapp-meta";

/**
 * The outbox.
 *
 * Deciding to notify, rendering the text, and handing it to a provider are
 * three separate steps here, and only the first two happen inline with the
 * user's request. That split is what lets the business pick a WhatsApp
 * provider later without any of this code changing:
 *
 *   - `enqueue()` always succeeds and always writes a row. A booking must
 *     never fail because a message could not be sent.
 *   - With no provider configured, rows sit in `queued`. The office opens the
 *     booking and sends them by hand — which is exactly how it works today,
 *     except the exact wording is now pre-written and recorded.
 *   - When a provider is configured, `flush()` sends the same rows. Nothing
 *     else moves.
 *
 * Every message is attached to its booking, so "what did we actually tell this
 * customer?" has an answer six months later.
 */

export type TemplateKey =
  | "booking_confirmed_customer"
  | "booking_new_admin"
  | "agent_assigned_customer"
  | "agent_en_route_customer"
  | "agent_at_gate_customer"
  | "pickup_complete_customer"
  | "job_assigned_agent";

type EnqueueInput = {
  bookingId: string | null;
  templateKey: TemplateKey;
  audience: Audience;
  recipient: string;
  vars: Record<string, string>;
  channel?: NotificationChannel;
};

/**
 * Default copy. The `settings` table overrides any of these by key, so the
 * office can reword a message without a deploy — same mechanism the existing
 * wa_confirm/wa_status templates already use.
 */
export const DEFAULT_TEMPLATES: Record<TemplateKey, string> = {
  booking_confirmed_customer:
    "Hi {{name}}, your ScrapSquad pickup is booked.\n\n" +
    "Booking: {{code}}\nWhen: {{date}}, {{slot}}\nItems: {{items}}\n\n" +
    "We'll message you again when the squad is on the way.\n" +
    "Track or cancel: {{track}}",

  booking_new_admin:
    "New booking {{code}}\n\n" +
    "{{name}} · {{phone}}\n{{date}}, {{slot}}\n{{address}}\n" +
    "Items: {{items}}\nEstimate: {{estimate}}\n\nOpen: {{adminUrl}}",

  agent_assigned_customer:
    "Hi {{name}}, {{agentName}} from ScrapSquad will handle your pickup " +
    "{{code}} on {{date}} ({{slot}}).\n\n" +
    "You can reach them on {{agentPhone}}.\nTrack: {{track}}",

  agent_en_route_customer:
    "Hi {{name}}, {{agentName}} is on the way to you now for pickup {{code}}.\n\n" +
    "Track: {{track}}",

  // The one message that needs a reply rather than just informing. A gated
  // community will not let the van in until the resident tells the guard.
  agent_at_gate_customer:
    "Hi {{name}}, {{agentName}} from ScrapSquad is at your gate for pickup " +
    "{{code}}.\n\n" +
    "Please approve entry with your security desk, or call {{agentPhone}}.\n" +
    "We'll wait.",

  pickup_complete_customer:
    "Done — thanks {{name}}.\n\n" +
    "Pickup {{code}}\nWeight: {{weight}}\nPaid: {{amount}} ({{method}})\n\n" +
    "Receipt and photos: {{track}}",

  job_assigned_agent:
    "New job {{code}} — {{date}}, {{slot}}\n\n" +
    "{{name}} · {{phone}}\n{{address}}\n\nOpen: {{agentUrl}}",
};

/**
 * Renders and records one message. Never throws: a caller is always in the
 * middle of something more important than a notification.
 */
export async function enqueue(input: EnqueueInput): Promise<void> {
  try {
    const settings = await getSettings();
    // A settings row named after the template key wins over the default.
    const override = (settings as unknown as Record<string, unknown>)[input.templateKey];
    const template =
      typeof override === "string" && override.trim()
        ? override
        : DEFAULT_TEMPLATES[input.templateKey];

    const recipient =
      input.channel === "email" ? input.recipient : normalisePhone(input.recipient);
    if (!recipient) return;

    await sbAdmin()
      .from("notifications")
      .insert({
        booking_id: input.bookingId,
        template_key: input.templateKey,
        audience: input.audience,
        channel: input.channel ?? "whatsapp",
        recipient,
        body: fillTemplate(template, input.vars),
        payload: input.vars,
        status: "queued",
      });
    // Send after the response has gone out, not before it. The customer sees
    // their confirmation page at the same speed whether Meta is fast, slow or
    // down — and a provider outage leaves the row queued for the cron rather
    // than hanging the booking.
    scheduleFlush();
  } catch (err) {
    // Swallowed on purpose. A booking that succeeded must not be reported as
    // failed because the outbox insert did; the row is recoverable, the
    // customer's trust is not.
    console.error("notify.enqueue failed", input.templateKey, err);
  }
}

/**
 * Queues a flush for after the current response.
 *
 * `after()` only exists inside a request, and a floating promise in a
 * serverless function is killed the moment the response ends — so this is the
 * only way to send promptly without making the user wait. If it is unavailable
 * the message simply waits for the cron, which is why the failure is ignored.
 */
function scheduleFlush(): void {
  if (!hasProvider()) return;
  try {
    after(async () => {
      await flush(10);
    });
  } catch {
    // Outside a request scope. The cron will pick it up.
  }
}

/* ── delivery ──────────────────────────────────────────────────────── */

/**
 * The provider seam.
 *
 * Swapping WhatsApp providers means implementing this one function and
 * pointing `getDriver()` at it. Nothing above this line knows that providers
 * exist.
 */
type Driver = {
  name: string;
  send(
    to: string,
    templateKey: TemplateKey,
    vars: Record<string, unknown>,
  ): Promise<{ id?: string }>;
};

/**
 * Meta WhatsApp Cloud API, live as soon as the credentials exist.
 *
 * Nothing is stubbed here — `lib/whatsapp-meta.ts` is the finished integration.
 * With WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID set, queued messages send
 * themselves on the next flush. Without them this returns null and the outbox
 * keeps queueing, which is the same code path minus the network call, so the
 * business carries on sending by hand and nothing is lost in the meantime.
 */
function getDriver(): Driver | null {
  const cfg = metaConfig();
  if (!cfg) return null;
  return {
    name: "meta",
    send: (to, templateKey, vars) => sendTemplate(cfg, to, templateKey, vars),
  };
}

/** True when automated sending is live. The admin UI reads this to decide
 *  whether to show "queued, send by hand" or "sent automatically". */
export function hasProvider(): boolean {
  return getDriver() !== null;
}

/**
 * Attempts delivery of everything still queued, oldest first.
 *
 * Safe to call repeatedly and from anywhere — a cron route, an admin button,
 * or after a status change. Each row is marked before the next is tried, so a
 * crash mid-batch re-sends at most the one in flight.
 */
export async function flush(limit = 25): Promise<{ sent: number; failed: number }> {
  const driver = getDriver();
  if (!driver) return { sent: 0, failed: 0 };

  const db = sbAdmin();
  const { data: rows } = await db
    .from("notifications")
    .select("id, recipient, body, attempts, template_key, payload")
    .eq("status", "queued")
    .eq("channel", "whatsapp")
    .order("created_at", { ascending: true })
    .limit(limit)
    .returns<
      {
        id: string;
        recipient: string;
        body: string;
        attempts: number;
        template_key: TemplateKey;
        payload: Record<string, unknown>;
      }[]
    >();

  let sent = 0;
  let failed = 0;

  for (const row of rows ?? []) {
    try {
      const res = await driver.send(row.recipient, row.template_key, row.payload);
      await db
        .from("notifications")
        .update({
          status: "sent",
          provider: driver.name,
          provider_id: res.id ?? null,
          sent_at: new Date().toISOString(),
          attempts: row.attempts + 1,
          error: null,
        })
        .eq("id", row.id);
      sent++;
    } catch (err) {
      // Five attempts then stop, so one permanently bad number cannot pin the
      // queue and starve every message behind it.
      const attempts = row.attempts + 1;
      await db
        .from("notifications")
        .update({
          status: attempts >= 5 ? "failed" : "queued",
          attempts,
          error: err instanceof Error ? err.message : String(err),
        })
        .eq("id", row.id);
      failed++;
    }
  }

  return { sent, failed };
}

/* ── helpers ───────────────────────────────────────────────────────── */

/** Click-to-chat link for sending a queued message by hand. */
export function manualSendHref(recipient: string, body: string): string {
  return `https://wa.me/${normalisePhone(recipient)}?text=${encodeURIComponent(
    body.slice(0, 1500),
  )}`;
}

/** Where the office should be reached for operational alerts. */
export async function adminRecipient(): Promise<string> {
  const { business } = await getSettings();
  return business.whatsapp || site.whatsapp;
}

export { telHref };
