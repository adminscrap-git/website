import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookingByToken } from "@/app/actions/manage";
import { getSettings, getSlots } from "@/lib/queries";
import { canCancel, CANCEL_MESSAGE } from "@/lib/booking-rules";
import {
  addDays,
  formatDateLong,
  formatSlot,
  range,
  rupees,
  todayIST,
} from "@/lib/format";
import { buildBookingMessage, waLink } from "@/lib/whatsapp";
import { STATUS_FLOW, STATUS_LABEL, UNIT_SHORT } from "@/lib/db-types";
import { site, telHref } from "@/lib/site";
import { cn } from "@/lib/cn";
import { BookingManage } from "@/components/site/booking-manage";
import { ButtonAnchor } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";

/**
 * Rendered per request rather than prerendered.
 *
 * Rates and the service area are admin-editable and expected to take effect
 * immediately, and it keeps `next build` from needing a reachable database.
 * If traffic ever makes this cost real, swap to `export const revalidate = 300`
 * — the queries are already shaped for it.
 */
export const dynamic = "force-dynamic";


// The token is a credential. Keep it out of search engines and out of any
// prefetch/preview that might otherwise cache it.
export const metadata: Metadata = {
  title: "Your pickup",
  robots: { index: false, follow: false, nocache: true },
};

export default async function BookingPage(props: PageProps<"/b/[token]">) {
  const { token } = await props.params;
  const { welcome } = await props.searchParams;

  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  const [settings, slots] = await Promise.all([getSettings(), getSlots()]);
  const { business, booking: rules } = settings;

  const verdict = canCancel(booking, rules.cancel_cutoff_hours);
  const cancelled = booking.status === "cancelled";
  const isNew = welcome !== undefined;

  const trackUrl = `${site.url}/b/${booking.token}`;
  const message = buildBookingMessage({
    booking,
    trackUrl,
    template: settings.wa_confirm,
  });
  const whatsappHref = waLink(business.whatsapp, message);

  const today = todayIST();
  const stageIndex = STATUS_FLOW.indexOf(booking.status);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      {/* ── welcome ──────────────────────────────────────────────── */}
      {isNew && !cancelled && (
        <div className="mb-12 rounded-toy bg-coral px-7 py-10 sm:px-10 sm:py-12">
          <h1 className="display text-[clamp(2.4rem,8vw,4.5rem)] text-ink">
            You&apos;re booked.
          </h1>
          <p className="mt-4 max-w-lg text-xl font-bold leading-snug text-ink/75">
            Send us the details on WhatsApp so we have them on your thread — then
            keep this page bookmarked. It&apos;s how you move or cancel the
            pickup, and it&apos;s the only link to it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonAnchor
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="cobalt"
              size="lg"
            >
              Send on WhatsApp →
            </ButtonAnchor>
            <CopyButton text={`${message}`} label="Copy the details" />
          </div>
        </div>
      )}

      {/* ── header ───────────────────────────────────────────────── */}
      <header>
        <p className="readout text-[11px] uppercase tracking-[0.18em] text-ink-2">
          Booking {booking.code}
        </p>
        <h2 className="display mt-4 text-[clamp(2.2rem,7vw,4rem)]">
          {cancelled ? (
            <span className="text-ink-3">Cancelled.</span>
          ) : (
            <>
              {formatDateLong(booking.pickup_date)}
              <br />
              <span className="text-cobalt">
                {booking.slot
                  ? `${booking.slot.label}, ${formatSlot(booking.slot)}`
                  : "Window to be confirmed"}
              </span>
            </>
          )}
        </h2>
      </header>

      {/* ── conveyor ─────────────────────────────────────────────── */}
      {cancelled ? (
        <div className="mt-10 rounded-toy bg-paper-2 px-6 py-6">
          <p className="text-lg font-bold">
            This pickup was cancelled
            {booking.cancelled_by === "admin" ? " by us" : " by you"}.
          </p>
          {booking.cancel_reason && (
            <p className="mt-1 text-base font-semibold text-ink-2">
              Reason: {booking.cancel_reason}
            </p>
          )}
          <a
            href="/book"
            className="mt-4 inline-block text-base font-bold text-cobalt underline underline-offset-4"
          >
            Book a new pickup →
          </a>
        </div>
      ) : (
        <ol className="mt-10 grid grid-cols-4 gap-1.5" aria-label="Pickup progress">
          {STATUS_FLOW.map((s, i) => {
            const reached = i <= stageIndex;
            return (
              <li key={s}>
                <div
                  className={cn(
                    "h-3 rounded-full transition-colors",
                    reached ? "bg-cobalt" : "bg-paper-3",
                  )}
                />
                <p
                  className={cn(
                    "readout mt-2.5 text-[10px] uppercase tracking-wider",
                    i === stageIndex ? "font-bold text-ink" : "text-ink-3",
                  )}
                >
                  {STATUS_LABEL[s]}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {/* ── what we're collecting ────────────────────────────────── */}
      <section className="mt-12">
        <h3 className="readout text-[11px] uppercase tracking-[0.16em] text-ink-2">
          We&apos;re collecting
        </h3>

        {booking.booking_items.length > 0 && (
          <ul className="mt-4 divide-y divide-paper-3 rounded-toy bg-paper-2 px-6">
            {booking.booking_items.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold">{line.name_snapshot}</p>
                  {line.category_name_snapshot && (
                    <p className="readout text-xs text-ink-3">
                      {line.category_name_snapshot}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="readout text-base font-bold">
                    {Number(line.qty)}
                    {line.unit_snapshot === "kg"
                      ? "kg"
                      : ` ${UNIT_SHORT[line.unit_snapshot]}`}
                  </p>
                  <p className="readout text-xs text-ink-3">
                    {/* Snapshot, not today's rate — this is what was quoted. */}
                    {range(line.price_min_snapshot, line.price_max_snapshot)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {booking.free_text_items && (
          <p className="mt-4 rounded-toy bg-paper-2 px-6 py-5 text-lg font-semibold">
            {booking.free_text_items}
          </p>
        )}

        {rules.show_estimate && booking.estimate_max > 0 && (
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 rounded-toy bg-cobalt-soft px-6 py-5">
            <p className="text-lg font-extrabold">Estimated at booking</p>
            <p className="readout text-2xl font-bold text-cobalt">
              {range(booking.estimate_min, booking.estimate_max)}
            </p>
            <p className="w-full text-sm font-semibold text-ink-2">
              The real number comes off the scale at your door. Minimum pickup{" "}
              {rupees(rules.min_pickup_value)}.
            </p>
          </div>
        )}
      </section>

      {/* ── where ────────────────────────────────────────────────── */}
      <section className="mt-12">
        <h3 className="readout text-[11px] uppercase tracking-[0.16em] text-ink-2">
          Coming to
        </h3>
        <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <Detail term="Name">{booking.name}</Detail>
          <Detail term="Mobile">+{booking.phone}</Detail>
          <div className="sm:col-span-2">
            <Detail term="Address">
              {booking.address_line}
              {booking.landmark && `, ${booking.landmark}`} — {booking.pincode}
            </Detail>
          </div>
          {booking.maps_url && (
            <div className="sm:col-span-2">
              <Detail term="Map">
                <a
                  href={booking.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-cobalt underline underline-offset-4"
                >
                  {booking.maps_url}
                </a>
              </Detail>
            </div>
          )}
          {booking.customer_notes && (
            <div className="sm:col-span-2">
              <Detail term="Your note">{booking.customer_notes}</Detail>
            </div>
          )}
        </dl>
      </section>

      {/* ── actions ──────────────────────────────────────────────── */}
      {!cancelled &&
        (verdict.allowed ? (
          <BookingManage
            token={booking.token}
            slots={slots}
            currentDate={booking.pickup_date}
            currentSlotId={booking.slot_id}
            today={today}
            maxDate={addDays(today, rules.max_days_ahead)}
          />
        ) : (
          <div className="mt-10 border-t-2 border-ink pt-8">
            <p className="text-lg font-bold">{CANCEL_MESSAGE[verdict.reason]}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonAnchor href={telHref} variant="outline">
                Call {business.phone}
              </ButtonAnchor>
              <ButtonAnchor
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                className="underline underline-offset-4"
              >
                Message on WhatsApp
              </ButtonAnchor>
            </div>
          </div>
        ))}

      {!isNew && !cancelled && (
        <div className="mt-10 rounded-toy bg-paper-2 px-6 py-5">
          <p className="text-base font-semibold text-ink-2">
            Keep this page bookmarked — it&apos;s the only link to this booking.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonAnchor
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              Message us about {booking.code}
            </ButtonAnchor>
            <CopyButton text={trackUrl} label="Copy this link" className="text-sm" />
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="readout text-[10px] uppercase tracking-[0.14em] text-ink-3">
        {term}
      </dt>
      <dd className="mt-1 text-lg font-semibold">{children}</dd>
    </div>
  );
}
