"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/button";
import { LocationChip } from "@/components/site/location-chip";
import { Wordmark } from "@/components/site/logo";

const NAV = [
  { href: "/rates", label: "Rates" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export function Header() {
  const pathname = usePathname();

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

      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-5 py-3 sm:px-8">
        {/* Mark on top, location directly under it. They had shared one line,
            which on a 390px phone meant a long area name and the menu fought
            for the same space and the name lost — "Set lo…". Stacked, the
            name gets the width it needs without pushing anything off. */}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          {/* No pill behind it any more: the mark carries its own disc and
              ring, and boxing a badge inside another badge muddied both. */}
          <Link
            href="/"
            className="shrink-0 text-cobalt transition-transform duration-150 hover:-rotate-2"
            aria-label="ScrapSquad — home"
          >
            <Wordmark className="text-[15px]" />
          </Link>

          {/* The column takes the free width rather than hugging the
              wordmark, or the chip is clamped to the width of "ScrapSquad"
              and an area name truncates to "Set locat…" with empty space
              beside it. */}
          <LocationChip className="-ml-1 py-1" />
        </div>

        {/* The inline nav that used to live here is gone: the bottom bar now
            carries those links at every width, and showing both put the same
            four destinations on screen twice. */}
        <div className="ml-auto flex items-center gap-2">
          {/* The crate badge that lived here is gone. The Book tab in the
              bottom bar carries the count at every width now, and two badges
              competing for a 390px header is what squeezed the location chip
              down to "Set lo…". */}
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
