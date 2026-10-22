import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogue, getSettings } from "@/lib/queries";
import { rupees } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PickShelf } from "@/components/site/pick-shelf";
import { toyForCategory, type ToyName } from "@/components/three/toy-map";

/**
 * Rendered per request rather than prerendered.
 *
 * Rates and the service area are admin-editable and expected to take effect
 * immediately, and it keeps `next build` from needing a reachable database.
 * If traffic ever makes this cost real, swap to `export const revalidate = 300`
 * — the queries are already shaped for it.
 */
export const dynamic = "force-dynamic";

/**
 * The rate card and the shelf, which used to be two pages showing the same
 * rows — /rates could only be read, /pick could be acted on. Someone who
 * searched for a price landed on the page that couldn't take the booking.
 *
 * This URL survived the merge because it's the one that ranks: people search
 * "scrap rates <city>", not "what we take". /pick redirects here, permanently,
 * from next.config.ts.
 *
 * The flow is now one line — see the rate, add it, schedule the pickup.
 * Scheduling stays on /book: it's noindex, and a full address form has no
 * business loading on the page search engines are meant to read.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { business } = await getSettings();
  return {
    title: `Scrap rates in ${business.city}`,
    description: `Today's scrap rates in ${business.city} — metal, e-waste, paper, plastic, appliances and furniture. Tap what you've got and book a free doorstep pickup. Digital weighing, instant cash or UPI.`,
    alternates: { canonical: "/rates" },
  };
}

export default async function RatesPage() {
  const [catalogue, settings] = await Promise.all([getCatalogue(), getSettings()]);
  const { business, booking } = settings;

  // Which toy lands in the crate for each item, resolved once on the server so
  // the client never has to know about the category → toy mapping.
  const toyByItem: Record<string, ToyName> = {};
  for (const cat of catalogue) {
    const toy = toyForCategory(cat.slug);
    for (const item of cat.items) toyByItem[item.id] = toy;
  }

  const totalItems = catalogue.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 sm:py-16">
      <header className="max-w-3xl">
        <p className="readout text-[11px] uppercase tracking-[0.18em] text-ink-2">
          Rate card · {totalItems} items
        </p>
        <h1 className="display mt-4 text-[clamp(2.6rem,8vw,5rem)]">
          Scrap rates in{" "}
          {/* The one shimmering element on the page. Two would be a casino. */}
          <span className="shimmer">{business.city}</span>.
        </h1>
        <p className="mt-6 text-xl font-semibold leading-snug text-ink-2">
          Every rate we pay, published. Tap what you&apos;ve got and we&apos;ll
          come and collect it. Metal moves with the commodity market, so these
          are ranges — the exact figure is settled on a certified digital scale
          at your door, in front of you.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {/* The ring breathes on the primary action only — scrapuncle puts it
              on their phone input, which is the same job on their page. */}
          <span className="pulse-ring inline-block rounded-full">
            <ButtonLink href="/book" size="md">
              Schedule a pickup →
            </ButtonLink>
          </span>
          <ButtonLink href="/book" size="md" variant="outline">
            Can&apos;t find it? Describe it instead
          </ButtonLink>
        </div>
      </header>

      <dl className="readout mt-12 grid grid-cols-2 gap-4 rounded-toy bg-paper-2 p-6 sm:grid-cols-4">
        {[
          ["Pickup charge", "₹0"],
          ["Minimum pickup", rupees(booking.min_pickup_value)],
          ["Payment", "Cash / UPI"],
          ["Weighing", "Digital"],
        ].map(([k, v], i) => (
          <Reveal key={k} delay={i * 0.06}>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-3">{k}</dt>
            <dd className="mt-1 text-lg font-bold text-ink">{v}</dd>
          </Reveal>
        ))}
      </dl>

      {catalogue.length === 0 ? (
        <p className="mt-16 rounded-toy bg-paper-2 p-10 text-center text-xl font-bold text-ink-2">
          No rates published yet. Add categories and items from the admin panel.
        </p>
      ) : (
        <div className="mt-14">
          <PickShelf
            catalogue={catalogue}
            toyByItem={toyByItem}
            showEstimate={booking.show_estimate}
            minPickupValue={booking.min_pickup_value}
          />
        </div>
      )}

      <section className="mt-20 rounded-toy bg-ink px-7 py-10 text-paper sm:px-10">
        <h2 className="display text-3xl sm:text-4xl">How these rates work</h2>
        <ul className="mt-6 space-y-4 text-lg font-semibold text-paper/75">
          <li>
            <strong className="text-paper">Ranges, not fixed prices.</strong>{" "}
            Copper, brass and aluminium track the commodity market and move week
            to week. Condition matters too — clean stripped wire is worth more
            than mixed coil.
          </li>
          <li>
            <strong className="text-paper">Per kg or per piece.</strong> Loose
            material is weighed. Appliances are priced per unit, because what
            matters is the metal and compressor inside, not the plastic shell.
          </li>
          <li>
            <strong className="text-paper">Settled at your door.</strong> We weigh
            in front of you on a certified digital scale, agree the figure, and pay
            in cash or UPI before we load the van.
          </li>
          <li>
            <strong className="text-paper">Nothing hidden.</strong> No pickup fee,
            no handling charge, no deduction for coming up three floors.
          </li>
        </ul>

        <p className="mt-8 text-base font-semibold text-paper/50">
          Unsure about something odd? Message us on{" "}
          <a
            href={`https://wa.me/${business.whatsapp}`}
            className="text-sun underline underline-offset-4"
          >
            WhatsApp
          </a>{" "}
          with a photo and we&apos;ll quote it, or just{" "}
          <Link href="/book" className="text-sun underline underline-offset-4">
            schedule a pickup
          </Link>{" "}
          and describe it on the form.
        </p>
      </section>
    </div>
  );
}
