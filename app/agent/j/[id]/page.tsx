import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAgent } from "@/lib/agent-auth";
import { sbAdmin } from "@/lib/supabase/admin";
import { formatClock, formatDate, formatSlot, rupees, telHref } from "@/lib/format";
import { STATUS_LABEL, PHOTO_LABEL } from "@/lib/db-types";
import type { BookingFull, BookingPhoto } from "@/lib/db-types";
import { JobControls } from "@/components/agent/job-controls";
import { signedProofUrls } from "@/lib/proofs";

export const dynamic = "force-dynamic";

export default async function AgentJobPage({ params }: PageProps<"/agent/j/[id]">) {
  const agent = await requireAgent();
  const { id } = await params;
  const db = sbAdmin();

  const { data: booking } = await db
    .from("bookings")
    .select("*, slot:time_slots(*), booking_items(*)")
    .eq("id", id)
    .maybeSingle<BookingFull>();

  // Not 403 — an agent has no business learning that a booking they can't
  // touch exists at all.
  if (!booking || booking.assigned_agent_id !== agent.user_id) notFound();

  const { data: photoRows } = await db
    .from("booking_photos")
    .select("*")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })
    .returns<BookingPhoto[]>();

  const photos = await signedProofUrls(photoRows ?? []);

  const address = [booking.address_line, booking.landmark, booking.pincode]
    .filter(Boolean)
    .join(", ");
  const mapsHref =
    booking.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <>
      <Link href="/agent" className="readout text-xs font-bold text-ink-2 underline underline-offset-4">
        ← All jobs
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="display text-3xl leading-none">{booking.name}</h1>
          <p className="readout mt-2 text-xs text-ink-3">
            {booking.code} · {formatDate(booking.pickup_date)} ·{" "}
            {booking.slot ? formatSlot(booking.slot) : "TBC"}
          </p>
        </div>
        <span className="readout shrink-0 rounded-full bg-cobalt px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-paper">
          {STATUS_LABEL[booking.status]}
        </span>
      </div>

      {/* Reaching the customer and finding the door are the two things needed
          most often and under the worst conditions, so they are the two
          biggest targets on the screen. */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <a
          href={telHref(booking.phone)}
          className="rounded-toy bg-cobalt px-4 py-4 text-center text-base font-extrabold text-paper active:translate-y-[2px]"
        >
          Call customer
        </a>
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-toy bg-coral px-4 py-4 text-center text-base font-extrabold text-ink active:translate-y-[2px]"
        >
          Navigate
        </a>
      </div>

      {/* The other end of "I'm at the gate". Standing outside a barrier not
          knowing whether anyone read the message is the whole problem this
          solves, so it sits above the address, where the agent is looking. */}
      {booking.status === "arrived" && (
        <p
          className={
            booking.gate_approved_at
              ? "readout mt-5 rounded-toy bg-cobalt px-4 py-3.5 text-center text-sm font-bold text-paper"
              : "readout mt-5 rounded-toy bg-sun-soft px-4 py-3.5 text-center text-sm font-bold text-ink-2"
          }
        >
          {booking.gate_approved_at
            ? `Customer approved entry at ${formatClock(booking.gate_approved_at)}`
            : "Waiting for the customer to clear you at the gate…"}
        </p>
      )}


      <section className="mt-5 rounded-toy bg-paper p-4">
        <h2 className="readout text-[11px] uppercase tracking-[0.14em] text-ink-3">
          Address
        </h2>
        <p className="mt-1.5 text-base font-semibold leading-snug">{address}</p>
        {booking.customer_notes && (
          <>
            <h2 className="readout mt-4 text-[11px] uppercase tracking-[0.14em] text-ink-3">
              Customer notes
            </h2>
            <p className="mt-1.5 text-base font-semibold leading-snug text-ink-2">
              {booking.customer_notes}
            </p>
          </>
        )}
      </section>

      <section className="mt-4 rounded-toy bg-paper p-4">
        <h2 className="readout text-[11px] uppercase tracking-[0.14em] text-ink-3">
          Expecting
        </h2>
        <ul className="mt-2 space-y-1.5">
          {(booking.booking_items ?? []).map((it) => (
            <li key={it.id} className="flex justify-between gap-3 text-base font-bold">
              <span>{it.name_snapshot}</span>
              <span className="readout shrink-0 text-ink-2">
                {it.qty}
                {it.unit_snapshot === "kg" ? " kg" : "×"}
              </span>
            </li>
          ))}
          {booking.free_text_items && (
            <li className="text-base font-semibold text-ink-2">
              {booking.free_text_items}
            </li>
          )}
          {(booking.booking_items ?? []).length === 0 && !booking.free_text_items && (
            <li className="text-base font-semibold text-ink-3">Nothing listed.</li>
          )}
        </ul>
        {booking.estimate_max > 0 && (
          <p className="readout mt-3 text-sm font-bold text-cobalt">
            Office estimate {rupees(booking.estimate_min)}–{rupees(booking.estimate_max)}
          </p>
        )}
      </section>

      <JobControls
        bookingId={booking.id}
        status={booking.status}
        weight={booking.collected_weight}
        amount={booking.paid_amount}
        method={booking.payment_method}
        photos={photos.map((p) => ({
          id: p.id,
          kind: p.kind,
          label: PHOTO_LABEL[p.kind],
          url: p.url,
        }))}
      />
    </>
  );
}
