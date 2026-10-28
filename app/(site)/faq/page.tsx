import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/queries";
import { ButtonLink } from "@/components/ui/button";

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
  title: "FAQ",
  description:
    "How scrap pickup works, what we pay, how cancellation works, which areas we cover, and what we can and can't collect.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const { business, booking } = await getSettings();

  const faqs: { q: string; a: string }[] = [
    {
      q: "How does a pickup actually work?",
      a: `Pick what you've got from the rate card (or just describe it on the form), choose a date and a 45-minute window, and give us your address. We arrive in that window, weigh everything in front of you on a certified digital scale, agree the amount, and pay you cash or UPI before we load the van.`,
    },
    {
      q: "Do I need to create an account?",
      a: "No. Booking takes a name, a mobile number and an address. You get a private link to your booking — that's how you track it, move it or cancel it. Keep the link and you never need a password.",
    },
    {
      q: "How do I cancel or reschedule?",
      a: `Open your booking link and use "Move it" or "Cancel this pickup". You can do either yourself up to ${booking.cancel_cutoff_hours} hours before your window opens. After that, give us a call and we'll sort it out — there's no cancellation charge either way.`,
    },
    {
      q: "I lost my booking link. Now what?",
      a: `Message us on WhatsApp or call ${business.phone} with your name and the address you booked. We'll find the booking and send the link back to you.`,
    },
    {
      q: "How do you pay?",
      a: "Cash or UPI, at your door, before we leave. Nothing is paid later and nothing is transferred afterwards — if the van drives off, you've already been paid.",
    },
    {
      q: "Why are the rates a range and not one number?",
      a: "Metal prices track the commodity market and move week to week, and condition changes what something is worth — clean stripped copper is worth more than mixed coil, an AC with its compressor intact more than one without. The range is the honest version. The exact figure is settled on the scale in front of you.",
    },
    {
      q: "Do you charge for pickup?",
      a: "No. Pickup is free, including from upper floors without a lift, and there's no handling or transport deduction.",
    },
    {
      q: "Which areas do you cover?",
      a: `We're currently in ${business.city}. Put your pincode into the booking form — if we're not there yet you can leave your number, and that list is genuinely how we decide where to expand.`,
    },
    {
      q: "What won't you take?",
      a: "Anything hazardous or medical — chemicals, paint, gas cylinders, asbestos, medical waste, or anything wet or contaminated. If you're unsure, send a photo on WhatsApp and we'll tell you straight away.",
    },
    {
      q: "What happens to my old laptop's data?",
      a: "Storage is wiped before anything is passed on for recycling. If the data matters to you, the safest thing is still to wipe or remove the drive yourself before we arrive — tell the driver and they'll wait while you do it.",
    },
    {
      q: "Where does it all end up?",
      a: "With registered recyclers. E-waste especially — that's the material that does real damage in a landfill, and it's the part we're strictest about.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      {/* Rich result eligibility. The same content as below, nothing hidden. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <header>
        <p className="readout text-[11px] uppercase tracking-[0.18em] text-ink-2">
          Questions
        </p>
        <h1 className="display mt-4 text-[clamp(2.6rem,8vw,5rem)]">
          The things
          <br />
          <span className="text-cobalt">everyone asks.</span>
        </h1>
      </header>

      {/* Native <details>. Keyboard-accessible, findable with Ctrl+F, zero JS. */}
      <div className="mt-14 divide-y-2 divide-paper-3 border-y-2 border-paper-3">
        {faqs.map((f) => (
          <details key={f.q} className="group">
            {/* Padding lives on the summary, not the details, so the whole
                row is the tap target rather than just the text. */}
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
              <h2 className="text-xl font-extrabold leading-snug sm:text-2xl">
                {f.q}
              </h2>
              <span
                aria-hidden
                className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-2 text-xl font-bold transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="max-w-2xl pb-6 pr-14 text-lg font-semibold leading-snug text-ink-2">
              {f.a}
            </p>
          </details>
        ))}
      </div>

      <section className="mt-16 rounded-toy bg-cobalt px-7 py-10 text-paper sm:px-10">
        <h2 className="display text-3xl sm:text-4xl">Still stuck?</h2>
        <p className="mt-3 max-w-md text-lg font-semibold text-paper/75">
          Send a photo of whatever it is on WhatsApp. Fastest way to get a real
          answer from a real person.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${business.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-sun px-7 py-3.5 text-lg font-extrabold text-ink border-b-[5px] border-[#8a5a12] active:translate-y-[5px] active:border-b-0"
          >
            Message on WhatsApp
          </a>
          <ButtonLink
            href="/contact"
            variant="outline"
            size="lg"
            className="border-paper bg-transparent text-paper hover:bg-paper hover:text-ink"
          >
            Other ways to reach us
          </ButtonLink>
        </div>
      </section>

      <p className="mt-10 text-center text-base font-semibold text-ink-2">
        Ready when you are —{" "}
        <Link href="/rates" className="text-cobalt underline underline-offset-4">
          browse the rate card
        </Link>{" "}
        or{" "}
        <Link href="/book" className="text-cobalt underline underline-offset-4">
          book a pickup
        </Link>
        .
      </p>
    </div>
  );
}
