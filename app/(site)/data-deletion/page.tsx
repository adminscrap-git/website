import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/queries";
import { LegalPage } from "@/components/site/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Data Deletion Instructions",
  description:
    "How to ask ScrapSquad to delete the personal data we hold about you, including data collected through our website, WhatsApp, or Meta lead forms and ads.",
  alternates: { canonical: "/data-deletion" },
};

export default async function DataDeletionPage() {
  const { business } = await getSettings();
  const subject = encodeURIComponent("Data Deletion Request");

  return (
    <LegalPage
      title="Data Deletion Instructions"
      business={business}
      intro={
        <>
          You can ask us to delete the personal data we hold about you — from our
          website, from WhatsApp, or from a Meta lead form. Here is exactly how.
        </>
      }
    >
      <h2>How to request deletion</h2>
      <ol>
        <li>
          Send an email to{" "}
          <a href={`mailto:${business.email}?subject=${subject}`}>
            {business.email}
          </a>{" "}
          with the subject line <strong>&ldquo;Data Deletion Request&rdquo;</strong>.
        </li>
        <li>
          Include your full name and the phone number you used to book or message
          us, so we can find your records. You can also send the request from
          WhatsApp at {business.phone}.
        </li>
        <li>We may ask you to confirm your identity before deleting anything.</li>
      </ol>

      <h2>What happens next</h2>
      <ul>
        <li>We will confirm receipt of your request within 3 working days.</li>
        <li>
          We will delete your personal data from our systems within 30 days,
          except for records we must keep by law.
        </li>
        <li>We will confirm to you once deletion is complete.</li>
      </ul>

      <h2>What we cannot delete</h2>
      <p>
        Indian tax and accounting law requires us to keep books of account,
        including invoices and payment records, for up to 8 years. Those records
        are kept even after a deletion request, and are used for nothing except
        meeting that legal obligation. Everything else — your contact details,
        address, booking history, conversations, and pickup photographs — is
        deleted. The full retention periods are in section 8 of our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Facebook and Instagram users</h2>
      <p>
        If you shared your information with us through a Facebook or Instagram
        lead form or app, you can also remove ScrapSquad from your Facebook
        account settings (<strong>Settings &gt; Apps and Websites</strong>) and
        then email us to delete the data we hold. Removing the app stops further
        sharing; it does not by itself delete what we already hold, so please
        email us as well.
      </p>

      <h2>Questions</h2>
      <p>
        Email <a href={`mailto:${business.email}`}>{business.email}</a>, or see
        our <Link href="/privacy">Privacy Policy</Link> for what we collect and
        why.
      </p>
    </LegalPage>
  );
}
