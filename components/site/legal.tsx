import Link from "next/link";
import type { ReactNode } from "react";
import type { BusinessSettings } from "@/lib/db-types";
import { telHref } from "@/lib/format";

/**
 * The frame every policy page shares.
 *
 * These four pages exist to be read by two very different audiences — a
 * customer checking whether we keep their phone number, and a platform
 * reviewer checking whether the page says what it has to. Both are served by
 * the same thing: plain headings, short paragraphs, and a contact route that
 * actually works. No marketing furniture.
 *
 * Contact details are passed in from the settings table rather than written
 * into the text, so changing the business email in the admin changes it on
 * all four pages at once. A policy naming an address nobody reads is worse
 * than no policy.
 */

export const LAST_UPDATED = "1 November 2026";

export const POLICIES = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/cancellation", label: "Cancellation & Rescheduling" },
  { href: "/data-deletion", label: "Data Deletion" },
] as const;

export function LegalPage({
  title,
  intro,
  business,
  children,
}: {
  title: string;
  intro?: ReactNode;
  business: BusinessSettings;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[760px] px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
      <p className="readout text-[11px] uppercase tracking-[0.18em] text-ink-2">
        {business.name} · Policies
      </p>
      <h1 className="display mt-4 text-[clamp(2.4rem,7vw,4rem)] leading-[0.95]">
        {title}
      </h1>
      <p className="readout mt-5 text-[11px] uppercase tracking-[0.14em] text-ink-3">
        Last updated: {LAST_UPDATED}
      </p>

      {intro && (
        <p className="mt-8 text-xl font-semibold leading-snug text-ink-2">{intro}</p>
      )}

      <div className="legal-prose mt-10">{children}</div>

      {/* Every page ends the same way, because every one of them tells you to
          get in touch and none of them should make you go hunting for how. */}
      <section className="mt-14 rounded-toy bg-paper-2 px-6 py-7">
        <h2 className="display text-2xl">Contact us</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <Row label="Business">{business.name}</Row>
          <Row label="Grievance Officer">Sai</Row>
          <Row label="Email">
            <a
              href={`mailto:${business.email}`}
              className="inline-flex min-h-11 items-center break-all font-bold text-cobalt underline underline-offset-4"
            >
              {business.email}
            </a>
          </Row>
          <Row label="Phone / WhatsApp">
            <a
              href={telHref(business.phone)}
              className="inline-flex min-h-11 items-center font-bold text-cobalt underline underline-offset-4"
            >
              {business.phone}
            </a>
          </Row>
          <Row label="Address">Hyderabad, Telangana, India</Row>
          <Row label="Website">
            <a
              href="https://www.scrapsquad.in"
              className="font-bold text-cobalt underline underline-offset-4"
            >
              www.scrapsquad.in
            </a>
          </Row>
        </dl>
      </section>

      <nav className="mt-10 border-t-2 border-paper-3 pt-6">
        <h2 className="readout text-[11px] uppercase tracking-[0.16em] text-ink-3">
          Other policies
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {POLICIES.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="flex min-h-11 items-center text-base font-bold text-ink-2 underline underline-offset-4 transition-colors hover:text-cobalt"
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="readout text-[10px] uppercase tracking-[0.14em] text-ink-3">
        {label}
      </dt>
      <dd className="mt-0.5 text-base font-semibold text-ink">{children}</dd>
    </div>
  );
}
