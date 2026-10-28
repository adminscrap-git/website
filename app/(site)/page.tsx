import Link from "next/link";
import Image from "next/image";
import squadPhoto from "@/public/squad.webp";
import step1 from "@/public/how-it-works-1.webp";
import step2 from "@/public/how-it-works-2.webp";
import step3 from "@/public/how-it-works-3.webp";
import { getCatalogue, getSettings } from "@/lib/queries";
import { rupees } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
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

/** The hero drawing, cut into its three steps. Order is the order on screen. */
const HOW_IT_WORKS = [
  { src: step1, alt: "Step one — book a slot online: a phone showing a date and time picker with 4:30 pm chosen, free and with no signup." },
  { src: step2, alt: "Step two — we weigh it in front of you: two ScrapSquad collectors in uniform, one holding a digital hanging scale reading 12.5 kg, the other a sack of sorted recyclables." },
  { src: step3, alt: "Step three — paid on the spot: a ScrapSquad collector showing a phone that reads Pickup Confirmed, 12.5 kg, ₹125." },
];


export default async function HomePage() {
  const [catalogue, settings] = await Promise.all([getCatalogue(), getSettings()]);
  const { business, booking } = settings;

  const totalItems = catalogue.reduce((n, c) => n + c.items.length, 0);

  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 pb-6 pt-2 sm:px-8 lg:pt-6">
        {/* One column, not two. The art is no longer decoration beside the
            copy — it is the three steps, and it needs the full width to be
            read. Copy stays above it so the CTA is never pushed below the
            fold on a 667px screen. */}
        {/* Headline left, the promise and the buttons right. Stacked, the
            headline left half the row empty once the 3D scene it used to sit
            beside was replaced by the full-width steps below. */}
        <div className="lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-14">
          <div>
            <p className="readout text-[11px] uppercase tracking-[0.18em] text-ink-2">
              Doorstep scrap pickup · {business.city}
            </p>

            {/* Smaller cap than the old headline carried: "Your scrap." is a
                longer line than "Scrap in.", and at the previous size it broke
                to three lines and pushed the CTA behind the tab bar. */}
            <h1 className="display mt-5 text-[clamp(3rem,9vw,7rem)]">
              Your scrap.
              <br />
              <span className="text-cobalt">Our squad.</span>
            </h1>
          </div>

          <div className="lg:pb-4">
            <p className="mt-7 max-w-lg text-xl font-semibold leading-snug text-ink-2 sm:text-2xl lg:mt-0">
              Book a free pickup in under a minute. We weigh everything at your
              door on a certified digital scale and pay you{" "}
              <span className="text-ink">cash or UPI before we leave</span>.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/rates" size="lg">
                Pick your scrap →
              </ButtonLink>
              <ButtonLink href="/book" size="lg" variant="outline">
                Or just book a pickup
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* Three panels cut from one drawing, so on a phone each step is a
            full-width picture you can actually read, and from sm up they sit
            back together into the single scene they were cut from. The widths
            are the pixel widths of the cuts — anything else and the pavement
            and the dotted arrows do not line up across the seams.

            One set of files for both layouts: an <Image> hidden with CSS is
            still downloaded, so a separate "whole scene" asset would cost
            every phone an image it never shows. */}
        <div className="mt-10 grid gap-4 sm:grid-cols-[545fr_585fr_470fr] sm:gap-0">
          {HOW_IT_WORKS.map((step, i) => (
            <Image
              key={step.alt}
              src={step.src}
              alt={step.alt}
              sizes="(min-width: 640px) 34vw, 100vw"
              placeholder="blur"
              priority={i === 0}
              className="h-auto w-full"
            />
          ))}
        </div>
      </section>

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

      {/* ── the squad ────────────────────────────────────────────── */}
      {/* No card, no border, no shadow. The artwork's own background is cream
          at #fdf4e2 and the page is #fdf6ec, so left bare it dissolves into
          the page — the moment it sits in a container it becomes a sticker. */}
      <section className="mx-auto max-w-[1400px] px-5 pb-8 sm:px-8">
        <Reveal>
          <div className="grid items-center gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
            <div>
              <p className="readout text-[11px] uppercase tracking-[0.18em] text-cobalt">
                The squad
              </p>
              <h2 className="display mt-4 text-[clamp(2.4rem,6vw,4.5rem)]">
                The people
                <br />
                <span className="text-cobalt">at your door.</span>
              </h2>
              <p className="mt-6 max-w-md text-lg font-semibold leading-snug text-ink-2">
                Uniformed, ID-carrying and trained on the scale. The same
                people your neighbours already know — we work gated
                communities across {business.city} every day.
              </p>
            </div>

            <Image
              src={squadPhoto}
              alt="Three ScrapSquad collectors outside a gated community — one holding a digital hanging scale reading 12.5 kg, one carrying a sack of sorted recyclables, one showing a confirmed pickup on a phone."
              sizes="(min-width: 1024px) 60vw, 100vw"
              placeholder="blur"
              className="feather h-auto w-full"
              priority={false}
            />
          </div>
        </Reveal>
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
                body: `Browse the rate card and tap whatever's lying around — ${totalItems} things across ${catalogue.length} categories. Not sure what it's called? Skip straight to the form and describe it.`,
              },
              {
                n: "02",
                title: "Choose a day and a window",
                body: `45-minute windows, 9am to 6pm, up to ${booking.max_days_ahead} days ahead. Your booking link lets you move it or cancel it yourself, no phone call needed.`,
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
              <ButtonLink href="/rates" size="lg" className="bg-sun border-[#8a5a12] hover:bg-[#f2c05c]">
                See the rates →
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
                  href={`/rates#${cat.slug}`}
                  className="group flex h-full flex-col justify-between rounded-toy border-2 border-transparent bg-paper-2 p-7 transition-colors hover:border-ink hover:bg-paper"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="display text-3xl sm:text-4xl">{cat.name}</h3>
                      <span
                        className="mt-1 h-5 w-5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
                        style={{
                          background: ["#145a32", "#f5a623", "#e8b53d"][i % 3],
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
              <ButtonLink href="/rates" size="lg" variant="cobalt">
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
