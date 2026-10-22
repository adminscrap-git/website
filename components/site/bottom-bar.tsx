"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCrate } from "@/lib/crate";
import { cn } from "@/lib/cn";

/**
 * The primary nav, at every screen size.
 *
 * Because it shows on desktop too, the header's inline nav is gone — the same
 * four links in two places is how a user stops trusting either. The header
 * keeps what the bar can't hold: the mark, the location, and the book CTA.
 *
 * The hamburger sheet stays as the full menu (it also reaches FAQ and Book).
 * Duplication there is the point — a tab bar that needs a menu to be complete
 * isn't a tab bar, but a menu that omits the tabs is a puzzle.
 */

type Tab = {
  href: string;
  label: string;
  icon: () => React.JSX.Element;
  /** Only the crate tab carries the count badge. */
  crate?: boolean;
};

/**
 * "Rates" is the merged catalogue — the rate card you can add from.
 *
 * Crate and Book are one tab, not two, because /book IS the crate: the form
 * renders your picked items above the address fields. Two tabs pointing at one
 * URL would both light up as the current page. The badge rides on it, so the
 * count is still visible from anywhere, and scheduling stays one tap away.
 */
const TABS: Tab[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/rates", label: "Rates", icon: RatesIcon },
  { href: "/book", label: "Book", icon: CrateIcon, crate: true },
  { href: "/faq", label: "FAQ", icon: ShelfIcon },
  { href: "/contact", label: "Contact", icon: AccountIcon },
];

export function BottomBar() {
  const pathname = usePathname();
  const { count } = useCrate();

  return (
    <nav
      aria-label="Primary"
      // The gradient is not decoration: the bar is a floating pill, so without
      // it the page scrolls visibly through the gutter around and below it.
      className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-paper via-paper/85 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5"
    >
      {/* Capped and centred rather than full-bleed: stretched across 1400px it
          reads as a footer, not a control. Same height at every width so
          `--bottombar-h` stays a single number. */}
      <div className="mx-auto flex max-w-md items-stretch justify-between rounded-toy bg-paper-2/95 p-1.5 shadow-lg shadow-ink/10 backdrop-blur-md sm:max-w-xl">
        {TABS.map((t) => {
          const active = pathname === t.href;
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded-sm px-1 py-2 transition-colors",
                active ? "bg-coral-soft text-cobalt-deep" : "text-ink-2",
              )}
            >
              <span className="relative">
                <Icon />
                {t.crate && count > 0 && (
                  <span className="readout absolute -right-2.5 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-ink">
                    {count}
                    <span className="sr-only">items in your crate</span>
                  </span>
                )}
              </span>
              <span className="text-[10px] font-bold leading-none">{t.label}</span>
              {/* The dot, not an underline — a 2px rule under a 10px label
                  reads as a text decoration on a small screen. */}
              <span
                className={cn(
                  "h-1 w-1 rounded-full bg-cobalt transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ── glyphs ────────────────────────────────────────────────────── */

const STROKE = {
  width: 21,
  height: 21,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function HomeIcon() {
  return (
    <svg {...STROKE} aria-hidden>
      <path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.8Z" />
    </svg>
  );
}

function ShelfIcon() {
  return (
    <svg {...STROKE} aria-hidden>
      <path d="M3 8h18M3 8V5h18v3M4 8v11h16V8M9 12h6" />
    </svg>
  );
}

function CrateIcon() {
  return (
    <svg {...STROKE} aria-hidden>
      <path d="M3 6.5h18V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6.5Z" />
      <path d="M2.5 6.5 5 3h14l2.5 3.5M9.5 10.5h5" />
    </svg>
  );
}

function RatesIcon() {
  return (
    <svg {...STROKE} aria-hidden>
      <path d="M5 3h14a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg {...STROKE} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}
