import Link from "next/link";
import { site, telHref, promises } from "@/lib/site";
import { Wordmark } from "./header";

const COLUMNS = [
  {
    title: "Book",
    links: [
      { href: "/pick", label: "What we take" },
      { href: "/book", label: "Book a pickup" },
      { href: "/rates", label: "Today's rates" },
    ],
  },
  {
    title: "Know",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/#how", label: "How it works" },
    ],
  },
] as const;

export function Footer() {
  const waHref = `https://wa.me/${site.whatsapp}`;

  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Wordmark className="text-[22px]" />
            <p className="mt-4 max-w-xs text-lg font-semibold leading-snug text-paper/70">
              {site.tagline} We collect scrap from your door in {site.city} and pay
              you on the spot.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {promises.map((p) => (
                <span
                  key={p.label}
                  className="readout rounded-full border border-paper/20 px-3 py-1.5 text-[11px] uppercase tracking-wider text-paper/60"
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="readout text-[11px] uppercase tracking-[0.16em] text-paper/40">
                {col.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-lg font-bold text-paper/85 transition-colors hover:text-coral"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="readout text-[11px] uppercase tracking-[0.16em] text-paper/40">
              Reach us
            </h2>
            <ul className="mt-4 space-y-2.5 text-lg font-bold">
              <li>
                <a href={waHref} className="text-paper/85 transition-colors hover:text-coral">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={telHref} className="text-paper/85 transition-colors hover:text-coral">
                  {site.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="break-all text-paper/85 transition-colors hover:text-coral"
                >
                  {site.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="readout mt-14 flex flex-col gap-3 border-t border-paper/15 pt-6 text-[11px] uppercase tracking-wider text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>
            Rates shown are indicative — the final amount is confirmed on digital
            weighing at pickup.
          </p>
        </div>
      </div>
    </footer>
  );
}
