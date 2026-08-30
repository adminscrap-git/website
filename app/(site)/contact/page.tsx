import type { Metadata } from "next";
import { getSettings } from "@/lib/queries";
import { ContactForm } from "@/components/site/contact-form";
import { site } from "@/lib/site";

/**
 * Rendered per request rather than prerendered.
 *
 * Rates and the service area are admin-editable and expected to take effect
 * immediately, and it keeps `next build` from needing a reachable database.
 * If traffic ever makes this cost real, swap to `export const revalidate = 300`
 * — the queries are already shaped for it.
 */
export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Contact",
  description:
    "Phone, WhatsApp and email for MINT scrap collection. Fastest reply is WhatsApp.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const { business } = await getSettings();
  const tel = `tel:${business.phone.replace(/[^\d+]/g, "")}`;

  const channels = [
    {
      label: "WhatsApp",
      value: "Message us",
      detail: "Usually answered within the hour. Send photos of anything unusual.",
      href: `https://wa.me/${business.whatsapp}`,
      external: true,
      accent: "bg-cobalt text-paper",
    },
    {
      label: "Phone",
      value: business.phone,
      detail: "Faster if you'd rather just talk to someone.",
      href: tel,
      external: false,
      accent: "bg-paper-2 text-ink",
    },
    {
      label: "Email",
      value: business.email,
      detail: "For invoices, bulk collections and anything with an attachment.",
      href: `mailto:${business.email}`,
      external: false,
      accent: "bg-paper-2 text-ink",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: business.name,
            description: site.description,
            telephone: business.phone,
            email: business.email,
            url: site.url,
            areaServed: business.city,
            ...(business.address && {
              address: { "@type": "PostalAddress", streetAddress: business.address },
            }),
          }),
        }}
      />

      <header>
        <p className="readout text-[11px] uppercase tracking-[0.18em] text-ink-2">
          Get in touch
        </p>
        <h1 className="display mt-4 text-[clamp(2.6rem,8vw,5rem)]">
          Talk to
          <br />
          <span className="text-cobalt">an actual person.</span>
        </h1>
        <p className="mt-6 max-w-xl text-xl font-semibold leading-snug text-ink-2">
          No ticket numbers, no hold music. Whichever of these you use, someone
          who can actually help will answer.
        </p>
      </header>

      <div className="mt-14 grid gap-3 sm:grid-cols-3">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            {...(c.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={`group flex flex-col justify-between rounded-toy p-7 transition-transform duration-150 hover:-translate-y-1 ${c.accent}`}
          >
            <div>
              <p className="readout text-[11px] uppercase tracking-[0.16em] opacity-60">
                {c.label}
              </p>
              <p className="display mt-3 break-words text-2xl">{c.value}</p>
            </div>
            <p className="mt-6 text-sm font-semibold opacity-70">{c.detail}</p>
          </a>
        ))}
      </div>

      <div className="mt-6">
        <ContactForm whatsapp={business.whatsapp} />
      </div>

      <section className="mt-16 grid gap-8 border-t-2 border-paper-3 pt-10 sm:grid-cols-2">
        <div>
          <h2 className="readout text-[11px] uppercase tracking-[0.16em] text-ink-2">
            Service area
          </h2>
          <p className="mt-3 text-xl font-bold">{business.city}</p>
          <p className="mt-2 text-base font-semibold text-ink-2">
            Not sure if we reach you? Put your pincode into the booking form —
            it&apos;ll tell you straight away, and you can leave your number if
            we&apos;re not there yet.
          </p>
        </div>

        {business.address && (
          <div>
            <h2 className="readout text-[11px] uppercase tracking-[0.16em] text-ink-2">
              Yard
            </h2>
            <p className="mt-3 text-lg font-semibold">{business.address}</p>
            {business.maps_url && (
              <a
                href={business.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-base font-bold text-cobalt underline underline-offset-4"
              >
                Open in Maps →
              </a>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
