import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getBookingById, getBookingEvents } from "@/lib/admin-queries";
import { getSettings } from "@/lib/queries";
import { buildStatusMessage, waLink } from "@/lib/whatsapp";
import { formatDateLong, formatSlot, range } from "@/lib/format";
import { STATUS_LABEL, UNIT_SHORT } from "@/lib/db-types";
import { site } from "@/lib/site";
import { Panel, StatusPill } from "@/components/admin/ui";
import { AdminNotes, StatusControls } from "@/components/admin/booking-controls";
import { CopyButton } from "@/components/ui/copy-button";
import { AssignAgent } from "@/components/admin/assign-agent";
import { ProofGallery } from "@/components/admin/proof-gallery";
import { Outbox } from "@/components/admin/outbox";
import { listActiveAgents } from "@/app/actions/agents";
import { sbAdmin } from "@/lib/supabase/admin";
import { signedProofUrls } from "@/lib/proofs";
import type { AgentProfile, BookingPhoto, Notification } from "@/lib/db-types";

export default async function BookingDetail(props: PageProps<"/admin/bookings/[id]">) {
  await requireAdmin();
  const { id } = await props.params;

  const booking = await getBookingById(id);
  if (!booking) notFound();

  const db = sbAdmin();
  const [events, settings, agents, photoRows, notifRows, assigned] = await Promise.all([
    getBookingEvents(booking.id),
    getSettings(),
    listActiveAgents(),
    db
      .from("booking_photos")
      .select("*")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false })
      .returns<BookingPhoto[]>()
      .then((r) => r.data ?? []),
    db
      .from("notifications")
      .select("*")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false })
      .returns<Notification[]>()
      .then((r) => r.data ?? []),
    booking.assigned_agent_id
      ? db
          .from("agent_profiles")
          .select("*")
          .eq("user_id", booking.assigned_agent_id)
          .maybeSingle<AgentProfile>()
          .then((r) => r.data)
      : Promise.resolve(null),
  ]);

  const photos = await signedProofUrls(photoRows);

  const trackUrl = `${site.url}/b/${booking.token}`;
  const message = buildStatusMessage({
    booking,
    trackUrl,
    template: settings.wa_status,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/bookings"
        className="text-sm font-bold text-ink-2 underline underline-offset-4"
      >
        ← All bookings
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="readout text-sm font-bold text-ink-3">{booking.code}</p>
          <h1 className="display mt-1 text-4xl">{booking.name}</h1>
          <p className="mt-2 text-lg font-semibold text-ink-2">
            {formatDateLong(booking.pickup_date)}
            {booking.slot && ` · ${booking.slot.label}, ${formatSlot(booking.slot)}`}
          </p>
        </div>
        <StatusPill status={booking.status} className="mt-2 text-xs" />
      </header>

      {/* Reaching the customer is the most common thing to do from this page,
          so it sits above everything else. */}
      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href={waLink(booking.phone, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-cobalt px-5 py-2.5 text-sm font-extrabold text-paper hover:bg-cobalt-deep"
        >
          WhatsApp customer
        </a>
        <a
          href={`tel:+${booking.phone}`}
          className="rounded-full bg-paper-2 px-5 py-2.5 text-sm font-extrabold hover:bg-paper-3"
        >
          Call +{booking.phone}
        </a>
        {booking.maps_url && (
          <a
            href={booking.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-paper-2 px-5 py-2.5 text-sm font-extrabold hover:bg-paper-3"
          >
            Open map ↗
          </a>
        )}
        <CopyButton
          text={trackUrl}
          label="Copy customer link"
          className="px-5 py-2.5 text-sm"
        />
      </div>

      <div className="mt-8 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          <Panel title="Status">
            <StatusControls id={booking.id} status={booking.status} />
          </Panel>

          <Panel
            title="Pickup agent"
            description={
              assigned
                ? `${assigned.full_name}${assigned.phone ? ` · ${assigned.phone}` : ""}`
                : "Nobody assigned yet."
            }
          >
            <AssignAgent
              bookingId={booking.id}
              agents={agents}
              current={booking.assigned_agent_id}
            />
          </Panel>

          <Panel
            title="Proof"
            description={
              photos.length === 0
                ? "The agent has not uploaded anything yet."
                : `${photos.length} photo${photos.length === 1 ? "" : "s"} from the field.`
            }
          >
            <ProofGallery
              photos={photos.map((p) => ({ id: p.id, kind: p.kind, url: p.url }))}
              weight={booking.collected_weight}
              amount={booking.paid_amount}
              method={booking.payment_method}
            />
          </Panel>

          <Panel
            title="Collecting"
            description={
              booking.booking_items.length > 0
                ? "Prices are what was quoted at booking, not today's rates."
                : "Booked straight from the form — no items picked."
            }
          >
            {booking.booking_items.length > 0 && (
              <table className="w-full text-left">
                <thead>
                  <tr className="readout border-b border-paper-3 text-[10px] uppercase tracking-wider text-ink-3">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 text-right font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Quoted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-3">
                  {booking.booking_items.map((line) => (
                    <tr key={line.id}>
                      <td className="py-2.5">
                        <p className="text-sm font-extrabold">{line.name_snapshot}</p>
                        {line.category_name_snapshot && (
                          <p className="readout text-[10px] uppercase tracking-wider text-ink-3">
                            {line.category_name_snapshot}
                          </p>
                        )}
                      </td>
                      <td className="readout py-2.5 text-right text-sm font-bold">
                        {Number(line.qty)}
                        {line.unit_snapshot === "kg"
                          ? "kg"
                          : ` ${UNIT_SHORT[line.unit_snapshot]}`}
                      </td>
                      <td className="readout py-2.5 text-right text-sm">
                        {range(line.price_min_snapshot, line.price_max_snapshot)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {booking.free_text_items && (
              <p className="mt-4 rounded-[14px] bg-sun-soft px-4 py-3 text-base font-semibold">
                <span className="readout block text-[10px] uppercase tracking-wider text-ink-3">
                  Described by the customer
                </span>
                {booking.free_text_items}
              </p>
            )}

            {booking.estimate_max > 0 && (
              <p className="readout mt-4 border-t border-paper-3 pt-4 text-right text-lg font-bold">
                {range(booking.estimate_min, booking.estimate_max)}
              </p>
            )}
          </Panel>

          <Panel title="Notes">
            <AdminNotes id={booking.id} value={booking.admin_notes} />
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Where">
            <dl className="space-y-4">
              <Row term="Address">
                {booking.address_line}
                {booking.landmark && (
                  <span className="block text-ink-2">{booking.landmark}</span>
                )}
                <span className="readout block text-xs text-ink-3">
                  {booking.pincode}
                </span>
              </Row>
              <Row term="Mobile">+{booking.phone}</Row>
              {booking.email && <Row term="Email">{booking.email}</Row>}
              {booking.customer_notes && (
                <Row term="Customer note">{booking.customer_notes}</Row>
              )}
              {booking.cancel_reason && (
                <Row term="Cancellation reason">
                  {booking.cancel_reason}
                  <span className="readout block text-xs text-ink-3">
                    by {booking.cancelled_by}
                  </span>
                </Row>
              )}
            </dl>
          </Panel>

          <Panel title="History">
            <ol className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cobalt"
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-bold">
                      {e.from_status
                        ? `${STATUS_LABEL[e.from_status]} → ${STATUS_LABEL[e.to_status]}`
                        : STATUS_LABEL[e.to_status]}
                      <span className="ml-1.5 font-semibold text-ink-3">
                        by {e.actor}
                      </span>
                    </p>
                    {e.note && (
                      <p className="text-xs font-semibold text-ink-2">{e.note}</p>
                    )}
                    <p className="readout text-[10px] text-ink-3">
                      {new Date(e.created_at).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel
            title="Messages"
            description={
              notifRows.length === 0
                ? "Nothing queued for this booking."
                : "Every message this booking has generated."
            }
          >
            <Outbox rows={notifRows} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="readout text-[10px] uppercase tracking-[0.14em] text-ink-3">
        {term}
      </dt>
      <dd className="mt-1 text-base font-semibold">{children}</dd>
    </div>
  );
}
