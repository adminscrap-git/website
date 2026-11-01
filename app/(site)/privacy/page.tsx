import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/queries";
import { LegalPage } from "@/components/site/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What personal information ScrapSquad collects when you book a scrap pickup, how we use it, who we share it with, how long we keep it, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const { business } = await getSettings();

  return (
    <LegalPage
      title="Privacy Policy"
      business={business}
      intro={
        <>
          What we collect when you book a pickup, what we do with it, and how to
          get it back or get it deleted.
        </>
      }
    >
      <h2>1. Introduction</h2>
      <p>
        ScrapSquad (&ldquo;ScrapSquad&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;,
        &ldquo;our&rdquo;) provides doorstep scrap collection services in{" "}
        {business.city}, Telangana, India, through our website{" "}
        <a href="https://www.scrapsquad.in">www.scrapsquad.in</a> and our WhatsApp
        number {business.phone}. This Privacy Policy explains what personal
        information we collect, how we use it, who we share it with, and the
        choices you have. By using our website or booking a pickup, you agree to
        this policy.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li>
          <strong>Contact details:</strong> your name, phone number, and email
          address (if you provide one).
        </li>
        <li>
          <strong>Pickup details:</strong> your pickup address, society or
          apartment name, preferred date and time slot, and the type and
          approximate quantity of scrap you want to sell.
        </li>
        <li>
          <strong>Payment information:</strong> your preferred payment mode (cash
          or UPI) and, for UPI payments, the UPI ID or number you give us. We do
          not collect or store your bank account or card details.
        </li>
        <li>
          <strong>Communication data:</strong> messages you send us on WhatsApp,
          calls, or email, including photos you share of your scrap.
        </li>
        <li>
          <strong>Pickup records:</strong> photographs our collector takes of the
          collected scrap and of payment confirmation, kept as a record of what
          was collected and what was paid.
        </li>
        <li>
          <strong>Technical data:</strong> IP address, browser type, device type,
          pages visited, and cookies, collected automatically when you use our
          website.
        </li>
        <li>
          <strong>Location:</strong> the location or area you enter to check
          service availability. If you tap the location button on our website, we
          use your device&rsquo;s approximate location to show your area name.
          This is stored only in your own browser and is never sent to us.
        </li>
      </ul>

      <h2>3. How we collect information</h2>
      <ul>
        <li>
          Directly from you, through our booking form, WhatsApp chats, phone
          calls, and emails.
        </li>
        <li>Automatically, through cookies and similar technologies on our website.</li>
        <li>
          From advertising platforms such as Meta (Facebook and Instagram) when
          you submit a lead form or click on our ads.
        </li>
      </ul>

      <h2>4. How we use your information</h2>
      <ul>
        <li>To schedule, confirm, reschedule, and complete your scrap pickup.</li>
        <li>To weigh your scrap and process payment.</li>
        <li>
          To send you booking confirmations, reminders, and service updates by
          WhatsApp, SMS, call, or email.
        </li>
        <li>To answer your questions and provide customer support.</li>
        <li>To improve our website, services, and rates.</li>
        <li>
          To measure and improve our advertising, including through Meta Pixel and
          analytics tools.
        </li>
        <li>To prevent fraud and comply with applicable law.</li>
      </ul>

      <h2>5. WhatsApp and messaging</h2>
      <p>
        We contact you on WhatsApp only about your booking or service, or for
        promotional updates where you have given consent. By providing your phone
        number and booking a pickup, you consent to receive WhatsApp, SMS, and
        call communications from us related to your pickup. You can opt out of
        non-essential messages at any time by replying STOP or by contacting us at{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a>. Your use of
        WhatsApp is also subject to WhatsApp&rsquo;s own terms and privacy policy.
      </p>

      <h2>6. Sharing of information</h2>
      <p>We do not sell your personal information. We share it only where needed with:</p>
      <ul>
        <li>
          <strong>Our collectors and staff,</strong> who need your name, address,
          and slot to complete the pickup.
        </li>
        <li>
          <strong>Service providers,</strong> such as website hosting,
          communication tools (including WhatsApp Business), analytics, and
          customer management software.
        </li>
        <li>
          <strong>Advertising platforms,</strong> such as Meta, to measure and
          improve our ads.
        </li>
        <li>
          <strong>Payment providers,</strong> to process UPI payments.
        </li>
        <li>
          <strong>Authorities,</strong> where required by law, court order, or to
          protect our rights and safety.
        </li>
      </ul>
      <p>We do not share your personal details with the recyclers who receive your scrap.</p>

      <h2>7. Cookies and tracking</h2>
      <p>
        We use cookies and similar technologies, including the Meta Pixel and
        analytics tools, to understand how visitors use our website and to measure
        advertising performance. You can control or delete cookies in your browser
        settings, and you can manage ad preferences through your Facebook and
        Instagram ad settings. Blocking cookies may affect some features of our
        website.
      </p>

      <h2>8. Data retention</h2>
      <p>
        We keep your personal information only as long as we need it, and
        different records have different lives:
      </p>
      <ul>
        <li>
          <strong>Booking and contact details</strong> — up to 2 years after your
          last pickup, so we can handle repeat bookings, disputes, and support
          requests.
        </li>
        <li>
          <strong>Payment and invoice records</strong> — up to 8 years. Indian tax
          and accounting law requires us to keep books of account for this period,
          so these records survive a deletion request.
        </li>
        <li>
          <strong>Pickup photographs</strong> — up to 1 year, as proof of what was
          collected and paid.
        </li>
        <li>
          <strong>WhatsApp and email conversations</strong> — up to 2 years.
        </li>
      </ul>
      <p>
        After these periods we delete the data or strip it of anything that
        identifies you.
      </p>

      <h2>9. Data security</h2>
      <p>
        We take reasonable steps to protect your information, including access
        controls and secure connections (HTTPS). No system is completely secure,
        so we cannot guarantee absolute security. Please do not share sensitive
        information, such as OTPs or passwords, with anyone claiming to be from
        ScrapSquad. Our collectors will never ask for them.
      </p>

      <h2>10. Your rights</h2>
      <p>
        Under applicable law, including India&rsquo;s Digital Personal Data
        Protection Act, 2023, you may:
      </p>
      <ul>
        <li>request access to the personal information we hold about you;</li>
        <li>ask us to correct inaccurate or incomplete information;</li>
        <li>ask us to delete your information;</li>
        <li>
          withdraw your consent to our processing of your data or to marketing
          messages;
        </li>
        <li>raise a grievance about how we handle your data.</li>
      </ul>
      <p>
        To exercise these rights, contact us at{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a>. We will respond
        within a reasonable time, and within 30 days wherever possible.
      </p>

      <h2>11. Data deletion</h2>
      <p>
        You can ask us to delete your personal data at any time by following the
        steps on our <Link href="/data-deletion">Data Deletion Instructions</Link>{" "}
        page. Records we are required by law to keep, such as payment and tax
        records, are retained for the periods set out in section 8.
      </p>

      <h2>12. Children&rsquo;s privacy</h2>
      <p>
        Our services are meant for adults. We do not knowingly collect personal
        data from anyone under 18. If you believe a child has given us
        information, contact us and we will delete it.
      </p>

      <h2>13. Third-party links</h2>
      <p>
        Our website may link to third-party sites, such as WhatsApp or Meta. We
        are not responsible for their content or privacy practices.
      </p>

      <h2>14. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The &ldquo;Last
        updated&rdquo; date at the top shows when it last changed. Continued use
        of our website or services after an update means you accept the revised
        policy.
      </p>
    </LegalPage>
  );
}
