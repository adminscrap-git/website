import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/queries";
import { LegalPage } from "@/components/site/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms that govern booking a scrap pickup with ScrapSquad — how rates and weighing work, payment, what we can't accept, your responsibilities, and our liability.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const { business, booking } = await getSettings();

  return (
    <LegalPage
      title="Terms & Conditions"
      business={business}
      intro={
        <>
          The rules of a pickup: what we&rsquo;ll collect, how the price is
          settled, and what each of us is responsible for.
        </>
      }
    >
      <p>
        These Terms &amp; Conditions govern your use of{" "}
        <a href="https://www.scrapsquad.in">www.scrapsquad.in</a> and the doorstep
        scrap collection services provided by ScrapSquad. By booking a pickup or
        using our website, you agree to these terms.
      </p>

      <h2>1. Our service</h2>
      <p>
        ScrapSquad collects scrap, including paper, plastic, metal, appliances,
        e-waste, furniture, and batteries, from homes and businesses in{" "}
        {business.city}. We weigh the scrap at your doorstep and pay you in cash
        or by UPI on the spot. Pickup is free of charge.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old and legally entitled to sell the items
        you hand over. By booking, you confirm that the scrap belongs to you or
        that you have the owner&rsquo;s permission to sell it.
      </p>

      <h2>3. Booking a pickup</h2>
      <ul>
        <li>
          You can book through our website or WhatsApp by choosing a date and a
          45-minute time window between 9 am and 6 pm, up to{" "}
          {booking.max_days_ahead} days ahead.
        </li>
        <li>You must give accurate contact details, address, and item information.</li>
        <li>
          A booking is confirmed once you receive a confirmation from us. Slots
          are subject to availability and service coverage.
        </li>
        <li>
          Please make sure someone is present at the address during the chosen
          window, along with the scrap, ready for collection.
        </li>
      </ul>

      <h2>4. Rates and weighing</h2>
      <ul>
        <li>
          The rates on our website are indicative. They may change with market
          conditions, so check the <Link href="/rates">rate card</Link> when you
          book.
        </li>
        <li>
          The final amount is confirmed at pickup, after weighing on our digital
          scale in front of you.
        </li>
        <li>
          Some items, such as furniture, are priced on inspection by the
          collector.
        </li>
        <li>
          Items that are damaged, mixed, contaminated, or different from what you
          described may be priced differently.
        </li>
        <li>
          If you do not accept the final amount, you may decline the sale, and we
          will not take the items.
        </li>
      </ul>

      <h2>5. Payment</h2>
      <p>
        Payment is made by cash or UPI at the time of pickup, based on the final
        weighed amount. Please check the amount before the collector leaves. Once
        payment is made and items are collected, the sale is final.
      </p>

      <h2>6. Items we do not accept</h2>
      <p>
        We may refuse items that are hazardous, illegal, stolen, flammable,
        explosive, radioactive, medical or biological waste, or otherwise unsafe
        to handle. We may also refuse any item at the collector&rsquo;s discretion
        for safety or legal reasons.
      </p>

      <h2>7. Your responsibilities</h2>
      <ul>
        <li>
          Remove personal data from phones, laptops, and other devices before
          handing them over. We are not responsible for data left on devices you
          sell.
        </li>
        <li>
          Remove valuables and personal belongings from items such as furniture,
          appliances, and bags.
        </li>
        <li>
          Provide safe access for our collectors. Items on upper floors without
          lift access may be subject to inspection and our discretion.
        </li>
      </ul>

      <h2>8. Our collectors</h2>
      <p>
        Our collectors carry ID and wear a uniform. If someone claiming to be from
        ScrapSquad arrives without ID, please contact us before handing over
        anything.
      </p>

      <h2>9. E-waste</h2>
      <p>
        We hand over e-waste to authorised recyclers in line with applicable
        e-waste rules in India. Once sold, ownership of the items transfers to
        ScrapSquad.
      </p>

      <h2>10. Cancellation and rescheduling</h2>
      <p>
        You may reschedule or cancel a booking as described in our{" "}
        <Link href="/cancellation">Cancellation &amp; Rescheduling Policy</Link>.
      </p>

      <h2>11. Privacy</h2>
      <p>
        How we handle the personal information you give us when booking is set out
        in our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        To the extent permitted by law, ScrapSquad is not liable for indirect or
        consequential losses, for data left on sold devices, or for delays caused
        by events outside our control, such as traffic, weather, or strikes. Our
        total liability in connection with any booking will not exceed the amount
        payable for that pickup.
      </p>

      <h2>13. Website use</h2>
      <p>
        You agree not to misuse our website, including submitting false bookings,
        attempting to disrupt the site, or using it for unlawful purposes. All
        content on this website, including text, images, and logos, belongs to
        ScrapSquad and may not be copied without permission.
      </p>

      <h2>14. Changes</h2>
      <p>
        We may update these terms and our rates at any time. The version published
        on our website at the time of your booking applies.
      </p>

      <h2>15. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Courts in {business.city},
        Telangana, have exclusive jurisdiction over any dispute.
      </p>
    </LegalPage>
  );
}
