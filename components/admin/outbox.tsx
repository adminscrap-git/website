import { manualSendHref, hasProvider } from "@/lib/notify";
import type { Notification } from "@/lib/db-types";

const AUDIENCE_LABEL: Record<string, string> = {
  customer: "To customer",
  admin: "To office",
  agent: "To agent",
};

/**
 * Every message this booking has generated.
 *
 * While no WhatsApp provider is configured, each queued row shows a
 * click-to-send link — the office sends it in one tap with the wording already
 * written, which is strictly better than today's "open WhatsApp and type it".
 * When a provider is switched on, the same rows send themselves and this panel
 * becomes a delivery log without changing.
 */
export function Outbox({ rows }: { rows: Notification[] }) {
  if (rows.length === 0) {
    return <p className="text-sm font-semibold text-ink-2">Nothing yet.</p>;
  }

  const automated = hasProvider();

  return (
    <>
      {!automated && (
        <p className="mb-4 rounded-[12px] bg-sun-soft px-4 py-3 text-sm font-semibold text-ink">
          Automatic sending is not switched on yet, so these are queued. Tap
          <span className="font-bold"> Send</span> to fire one off with the text
          already filled in.
        </p>
      )}

      <ul className="space-y-3">
        {rows.map((n) => (
          <li key={n.id} className="rounded-[12px] border-2 border-paper-3 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="readout rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-2">
                {AUDIENCE_LABEL[n.audience] ?? n.audience}
              </span>
              <span className="readout text-[10px] uppercase tracking-wider text-ink-3">
                {n.template_key.replace(/_/g, " ")}
              </span>
              <span
                className={`readout ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  n.status === "sent"
                    ? "bg-cobalt text-paper"
                    : n.status === "failed"
                      ? "bg-coral-soft text-coral-deep"
                      : "bg-sun-soft text-[#8a5a12]"
                }`}
              >
                {n.status}
              </span>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-snug text-ink-2">
              {n.body}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="readout text-[10px] text-ink-3">{n.recipient}</span>
              {n.status === "queued" && n.channel === "whatsapp" && (
                <a
                  href={manualSendHref(n.recipient, n.body)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-cobalt underline underline-offset-4"
                >
                  Send on WhatsApp →
                </a>
              )}
              {n.error && (
                <span className="text-xs font-bold text-coral-deep">{n.error}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
