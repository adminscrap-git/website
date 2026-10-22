import Link from "next/link";
import { getCatalogue, getSettings } from "@/lib/queries";
import { ButtonLink } from "@/components/ui/button";
import { Marquee, TickerItem } from "@/components/ui/marquee";
import { Reveal } from "@/components/ui/reveal";
import { HeroScene } from "@/components/three/hero-scene";
import { range, rupees } from "@/lib/format";
import { UNIT_LABEL } from "@/lib/db-types";
import { promises } from "@/lib/site";

/**
 * Rendered per request rather than prerendered.
 *
 * Rates and the service area are admin-editable and expected to take effect
 * immediately, and it keeps `next build` from needing a reachable database.
 * If traffic ever makes this cost real, swap to `export const revalidate = 300`
 * — the queries are already shaped for it.
 */
export const dynamic = "force-dynamic";


export default async function HomePage() {
  const [catalogue, settings] = await Promise.all([getCatalogue(), getSettings()]);
  const { business, booking } = settings;

  // Highest-value item per category — the ticker should show the numbers that
  // make someone stop scrolling, not the ₹8/kg cardboard.
  const ticker = catalogue
    .flatMap((c) => c.items)
    .sort((a, b) => b.price_max - a.price_max)
    .slice(0, 10);

  const totalItems = catalogue.reduce((n, c) => n + c.items.length, 0);

  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-[1400px] items-center gap-4 px-5 pb-6 pt-2 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pt-6">
        <div className="order-2 lg:order-1">
          <p className="readout text-[11px] uppercase tracking-[0.18em] text-ink-2">
            Doorstep scrap pickup · {business.city}
          </p>

          <h1 className="display mt-5 text-[clamp(3.6rem,13vw,9.5rem)]">
            Scrap in.
            <br />
            <span className="text-cobalt">Cash out.</span>
          </h1>

          <p className="mt-7 max-w-lg text-xl font-semibold leading-snug text-ink-2 sm:text-2xl">
            Book a free pickup in under a minute. We weigh everything at your
            door on a certified digital scale and pay you{" "}
            <span className="text-ink">cash or UPI before we leave</span>.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/pick" size="lg">
              Pick your scrap →
            </ButtonLink>
            <ButtonLink href="/book" size="lg" variant="outline">
              Or just book a pickup
            </ButtonLink>
          </div>

          <p className="readout mt-6 text-[11px] uppercase tracking-[0.14em] text-ink-3">
            No signup · Cancel any time before pickup · Minimum pickup{" "}
            {rupees(booking.min_pickup_value)}
          </p>
        </div>

        <div className="order-1 lg:order-2">
          <HeroScene className="h-[46vh] min-h-[300px] w-full lg:h-[72vh] lg:min-h-[520px]" />
        </div>
      </section>

      {/* ── rate ticker ──────────────────────────────────────────── */}
      {ticker.length > 0 && (
        <section aria-label="Today's rates" className="border-y-2 border-ink bg-ink py-4 text-paper">
          <Marquee seconds={44}>
            {ticker.map((i) => (
              <TickerItem
                key={i.id}
                label={i.name}
                value={`${range(i.price_min, i.price_max)} ${UNIT_LABEL[i.unit]}`}
              />
            ))}
          </Marquee>
        </section>
      )}

      {/* ── promises ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-4 md:grid-cols-3">
          {promises.map((p, i) => (
            <Reveal key={p.label} delay={i * 0.08}>
              <div className="h-full rounded-toy bg-paper-2 p-8">
                <span className="readout text-[11px] tracking-[0.16em] text-cobalt">
                  0{i + 1}
                </span>
                <h2 className="display mt-4 text-3xl sm:text-4xl">{p.label}</h2>
                <p className="mt-3 text-lg font-semibold text-ink-2">{p.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── how it works ─────────────────────────────────────────── */}
      <section id="how" className="scroll-mt-24 bg-cobalt text-paper">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <h2 className="display max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)]">
              Three steps. Nobody haggles.
            </h2>
          </Reveal>

          <ol className="mt-16 grid gap-x-8 gap-y-14 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Pick what you've got",
                body: `Browse the shelf and tap whatever's lying around — ${totalItems} things across ${catalogue.length} categories. Not sure what it's called? Skip straight to the form and describe it.`,
              },
              {
                n: "02",
                title: "Choose a day and a window",
                body: `Two-hour slots, up to ${booking.max_days_ahead} days ahead. Your booking link lets you move it or cancel it yourself, no phone call needed.`,
              },
              {
                n: "03",
                title: "We weigh, you get paid",
                body: "Certified digital scale at your door, weighed in front of you. Cash or UPI on the spot — before the van leaves.",
              },
            ].map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 0.1}>
                <span className="readout block text-6xl font-bold tracking-tighter text-paper/35 sm:text-7xl">
                  {s.n}
                </span>
                <h3 className="display mt-4 text-3xl sm:text-4xl">{s.title}</h3>
                <p className="mt-4 text-lg font-semibold leading-snug text-paper/75">
                  {s.body}
                </p>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.15}>
            <div className="mt-16">
              <ButtonLink href="/pick" size="lg" className="bg-sun border-[#c99516] hover:bg-[#ffd062]">
                Start with the shelf →
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── what we take ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <h2 className="display max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)]">
            If it&apos;s taking up space,
            <br />
            <span className="text-coral">we&apos;ll take it away.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalogue.map((cat, i) => {
            const cheapest = Math.min(...cat.items.map((it) => it.price_min));
            const dearest = Math.max(...cat.items.map((it) => it.price_max));
            return (
              <Reveal key={cat.id} delay={Math.min(i, 5) * 0.06}>
                <Link
                  href={`/pick#${cat.slug}`}
                  className="group flex h-full flex-col justify-between rounded-toy border-2 border-transparent bg-paper-2 p-7 transition-colors hover:border-ink hover:bg-paper"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="display text-3xl sm:text-4xl">{cat.name}</h3>
                      <span
                        className="mt-1 h-5 w-5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
                        style={{
                          background: ["#047857", "#10b981", "#ffc53d"][i % 3],
                        }}
                      />
                    </div>
                    <p className="mt-3 text-base font-semibold leading-snug text-ink-2">
                      {cat.description}
                    </p>
                  </div>
                  <p className="readout mt-7 text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    {cat.items.length} items · {rupees(cheapest)}–{rupees(dearest)}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── why we exist ─────────────────────────────────────────── */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            <Reveal>
              <p className="readout text-[11px] uppercase tracking-[0.18em] text-paper/40">
                Why we exist
              </p>
              <h2 className="display mt-5 text-[clamp(2.4rem,6vw,4.8rem)]">
                Selling scrap should not feel like a negotiation.
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="space-y-6 text-xl font-semibold leading-snug text-paper/75">
                <p>
                  The old way works, mostly. Someone comes, glances at your pile,
                  names a number, and you either take it or you don&apos;t. There&apos;s no
                  published rate, the scale is whatever&apos;s in the cart, and if they
                  don&apos;t turn up on Tuesday there&apos;s nobody to call.
                </p>
                <p className="text-paper">
                  We publish every rate on this site, weigh on a certified digital
                  scale in front of you, and give you a booking link that can be
                  moved or cancelled without speaking to anyone.
                </p>
                <p>
                  Everything we collect goes to registered recyclers — the e-waste
                  especially, which is the part that does real damage in a landfill.
                </p>
              </div>

              <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
                {[
                  { k: "Rates published", v: "Always" },
                  { k: "Weighing", v: "Certified" },
                  { k: "Payment", v: "On the spot" },
                  { k: "Pickup charge", v: "₹0" },
                  { k: "Signup needed", v: "None" },
                  { k: "Cancellation", v: "Self-serve" },
                ].map((s) => (
                  <div key={s.k}>
                    <dt className="readout text-[10px] uppercase tracking-[0.14em] text-paper/40">
                      {s.k}
                    </dt>
                    <dd className="display mt-1.5 text-2xl text-sun sm:text-3xl">
                      {s.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── what recycling actually saves ────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <h2 className="display max-w-2xl text-[clamp(2.4rem,6vw,4.6rem)]">
            The part nobody puts on a receipt.
          </h2>
          <p className="mt-6 max-w-xl text-xl font-semibold text-ink-2">
            Rough industry figures for what recycling saves versus making the same
            thing new. Your pile is small; the aggregate isn&apos;t.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { big: "~60kg", small: "of paper recycled spares roughly one tree" },
            { big: "95%", small: "less energy to recycle aluminium than to smelt it new" },
            { big: "~9 kWh", small: "saved per kg of household metal diverted" },
            { big: "0", small: "of our e-waste goes to landfill — all of it to registered recyclers" },
          ].map((s, i) => (
            <Reveal key={s.big} delay={i * 0.07}>
              <div className="h-full rounded-toy bg-sun-soft p-8">
                <p className="display text-5xl text-ink sm:text-6xl">{s.big}</p>
                <p className="mt-4 text-base font-semibold leading-snug text-ink-2">
                  {s.small}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── closing CTA ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 pb-8 sm:px-8">
        <Reveal>
          <div className="rounded-toy bg-coral px-8 py-16 text-center sm:px-16 sm:py-24">
            <h2 className="display mx-auto max-w-3xl text-[clamp(2.6rem,8vw,6rem)] text-ink">
              There is money on your balcony.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-xl font-bold text-ink/70">
              Takes about a minute. We&apos;ll come to you.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/pick" size="lg" variant="cobalt">
                Pick your scrap →
              </ButtonLink>
              <ButtonLink
                href="/book"
                size="lg"
                variant="outline"
                className="border-ink bg-transparent hover:bg-ink hover:text-paper"
              >
                Book straight away
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
