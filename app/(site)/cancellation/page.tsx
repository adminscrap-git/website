import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/queries";
import { LegalPage } from "@/components/site/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cancellation & Rescheduling Policy",
  description:
    "How to move or cancel a ScrapSquad pickup, how much notice we ask for, what happens on a no-show, and why there is never a charge.",
  alternates: { canonical: "/cancellation" },
};

export default async function CancellationPage() {
  const { business, booking } = await getSettings();
  const hours = booking.cancel_cutoff_hours;

  return (
    <LegalPage
      title="Cancellation & Rescheduling"
      business={business}
      intro={
        <>
          Move it, or call it off. There is no fee either way — pickup is free,
          and money only ever travels from us to you.
        </>
      }
    >
      <h2>1. Rescheduling or cancelling your pickup</h2>
      <p>
        You can move or cancel your booking yourself using the booking link in
        your confirmation, with no phone call needed. You can also message us on
        WhatsApp at {business.phone} or email{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a>.
      </p>
      <p>
        Lost the link? Message us with your name and the address you booked and
        we will send it back to you.
      </p>

      <h2>2. Timing</h2>
      <p>
        Please cancel or reschedule at least{" "}
        <strong>
          {hours} {hours === 1 ? "hour" : "hours"}
        </strong>{" "}
        before the start of your time window, so we can offer the slot to someone
        else and avoid a wasted trip. After that the booking link will no longer
        change it for you — call or message us instead and we will sort it out.
      </p>

      <h2>3. Charges</h2>
      <p>
        There is no fee for cancelling or rescheduling, however late it is. Pickup
        is free, and you only receive money from us, never the other way round.
      </p>

      <h2>4. No-show</h2>
      <p>
        If our collector arrives within your booked window and no one is
        available, or the scrap is not ready, we may mark the booking as a
        no-show. There is no charge, but we may contact you to rebook. Repeated
        no-shows may lead us to limit future bookings from that number or address.
      </p>

      <h2>5. Cancellation by ScrapSquad</h2>
      <p>
        We may need to reschedule or cancel a pickup because of unavoidable
        circumstances such as weather, vehicle issues, or safety concerns. If so,
        we will inform you as early as possible and offer the next available slot.
        We may also cancel bookings that are outside our service area or that
        involve items we do not accept, as listed in our{" "}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>

      <h2>6. Refusing the final amount</h2>
      <p>
        If you do not agree with the final amount after weighing, you may decline
        the sale at the door. No payment is made and no items are taken. There is
        no penalty, and it does not count as a no-show.
      </p>

      <h2>7. Completed pickups</h2>
      <p>
        Once the scrap has been collected and payment has been made, the sale is
        final and cannot be cancelled or reversed.
      </p>
    </LegalPage>
  );
}
