"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCrate } from "@/lib/crate";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/button";
import { LocationChip } from "@/components/site/location-chip";

const NAV = [
  { href: "/pick", label: "What we take" },
  { href: "/rates", label: "Rates" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-[3px]", className)}>
      <span className="display text-[1.6em] leading-none tracking-[-0.05em]">MINT</span>
      {/* The dot is the only place coral appears outside a CTA. */}
      <span className="mb-[0.12em] h-[0.22em] w-[0.22em] rounded-full bg-coral" />
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const { count } = useCrate();

  // The sheet remembers which route it was opened on. Navigating changes the
  // pathname, which closes it during render — no effect, no flash of the old
  // menu over the new page.
  const [menu, setMenu] = useState({ open: false, at: pathname });
  const open = menu.open && menu.at === pathname;
  const setOpen = (next: boolean) => setMenu({ open: next, at: pathname });

  // Lock the page behind the open sheet.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      {/* A sticky bar has to occlude, or the page scrolls visibly through the
          wordmark. The blur lives on its own layer rather than on <header>
          itself: backdrop-filter makes an element a containing block for
          `position: fixed` descendants, which trapped the menu sheet below
          inside this 72px box instead of letting it cover the page. */}
      <div
        className="absolute inset-0 -z-10 bg-paper/70 backdrop-blur-xl"
        aria-hidden
      />

      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="rounded-full bg-ink px-5 py-2.5 text-paper transition-transform duration-150 hover:-rotate-2"
          aria-label="MINT — home"
        >
          <Wordmark className="text-[15px]" />
        </Link>

        {/* Top-left, immediately after the mark — the Swiggy position. Allowed
            to shrink so a long area name never pushes the menu off a phone. */}
        <LocationChip className="min-w-0 shrink" />

        {/* The inline nav that used to live here is gone: the bottom bar now
            carries those links at every width, and showing both put the same
            four destinations on screen twice. */}
        <div className="ml-auto flex items-center gap-2">
          {count > 0 && (
            <Link
              href="/book"
              className="readout flex items-center gap-2 rounded-full bg-cobalt px-4 py-2.5 text-sm font-bold text-paper"
            >
              <CrateGlyph />
              {count}
              <span className="sr-only">items in your crate</span>
            </Link>
          )}

          {/* Wrapped rather than `hidden sm:inline-flex` on the button itself:
              the button's own base class sets `inline-flex`, and two display
              utilities at equal specificity are decided by stylesheet order,
              not attribute order. On a phone this is covered by the crate
              badge and the menu's full-width CTA. */}
          <span className="hidden sm:block">
            <ButtonLink href="/book" size="sm">
              Book a pickup
            </ButtonLink>
          </span>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-11 w-11 place-items-center rounded-full bg-paper-2"
          >
            <span className="relative block h-4 w-5">
              <span
                className={cn(
                  "absolute left-0 h-[3px] w-5 rounded-full bg-ink transition-all duration-200",
                  open ? "top-[7px] rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-[7px] h-[3px] w-5 rounded-full bg-ink transition-opacity duration-200",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 h-[3px] w-5 rounded-full bg-ink transition-all duration-200",
                  open ? "top-[7px] -rotate-45" : "top-[14px]",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* The full menu, now at every width. Full-bleed overlay, but the links
          are capped to a column — 4xl display type running the width of a
          1400px screen is a billboard, not a menu. */}
      <div
        className={cn(
          "fixed inset-x-0 top-[var(--header-h)] bottom-0 z-40 overflow-y-auto bg-paper px-5 pb-10 pt-4 sm:px-8",
          "transition-[opacity,transform] duration-200 ease-out",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0",
        )}
      >
        <div className="mx-auto max-w-lg">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="display border-b border-paper-3 py-5 text-4xl text-ink"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <ButtonLink href="/book" size="lg" className="mt-8 w-full">
            Book a pickup
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

function CrateGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M1.5 4.5h13v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M1 4.5 3 1.5h10l2 3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
