import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogue, getSettings } from "@/lib/queries";
import { range, rupees, unitLabel } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

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
 * Deliberately plain. No canvas, no motion, no cleverness.
 *
 * This is the page people find by searching "scrap rates <city>" and it needs
 * to be readable in one second on a bad connection. Everything interesting
 * happens on /pick.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { business } = await getSettings();
  return {
    title: `Scrap rates in ${business.city}`,
    description: `Today's scrap rates in ${business.city} — metal, e-waste, paper, plastic, appliances and furniture. Free doorstep pickup, digital weighing, instant cash or UPI.`,
    alternates: { canonical: "/rates" },
  };
}

export default async function RatesPage() {
  const [catalogue, settings] = await Promise.all([getCatalogue(), getSettings()]);
  const { business, booking } = settings;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <header>
        <p className="readout text-[11px] uppercase tracking-[0.18em] text-ink-2">
          Rate card
        </p>
        <h1 className="display mt-4 text-[clamp(2.6rem,8vw,5rem)]">
          Scrap rates in{" "}
          {/* The one shimmering element on the page. Two would be a casino. */}
          <span className="shimmer">{business.city}</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-xl font-semibold leading-snug text-ink-2">
          Every rate we pay, published. Metal moves with the commodity market, so
          these are ranges — the exact figure is settled on a certified digital
          scale at your door, in front of you.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {/* The ring breathes on the primary action only — scrapuncle puts it
              on their phone input, which is the same job on their page. */}
          <span className="pulse-ring inline-block rounded-full">
            <ButtonLink href="/pick" size="md">
              Pick your scrap →
            </ButtonLink>
          </span>
          <ButtonLink href="/book" size="md" variant="outline">
            Book a pickup
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
          No rates published yet.
        </p>
      ) : (
        <div className="mt-16 space-y-14">
          {catalogue.map((cat) => (
            <Reveal key={cat.id} as="section" className="scroll-mt-24">
              <h2
                id={cat.slug}
                className="display border-b-2 border-ink pb-3 text-3xl sm:text-4xl"
              >
                {cat.name}
              </h2>

              <table className="mt-2 w-full text-left">
                <caption className="sr-only">
                  {cat.name} scrap rates in {business.city}
                </caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-3">
                  {cat.items.map((item) => (
                    // The sweep runs on hover, so it costs nothing until a
                    // pointer is actually on the row — and never fires on touch.
                    <tr key={item.id} className="sweep">
                      <th scope="row" className="py-4 pr-4 align-top font-extrabold">
                        <span className="text-lg">{item.name}</span>
                        {item.note && (
                          <span className="block text-sm font-semibold text-ink-3">
                            {item.note}
                          </span>
                        )}
                      </th>
                      {/* Clears the side rail on a phone. Everywhere else the
                          rail just overlaps decoration; here it would sit on
                          top of the prices, which are the entire page. */}
                      <td className="readout py-4 pr-12 text-right align-top sm:pr-0">
                        <span className="block text-lg font-bold">
                          {range(item.price_min, item.price_max)}
                        </span>
                        <span className="block text-[10px] uppercase tracking-[0.12em] text-ink-3">
                          {unitLabel(item.unit)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          ))}
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
            book a pickup
          </Link>{" "}
          and describe it on the form.
        </p>
      </section>
    </div>
  );
}
