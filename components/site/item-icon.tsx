import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A drawn mark for every line on the rate card.
 *
 * Forty-three items, one icon each — a card that says "Newspaper" above a
 * picture of a fridge is worse than no picture at all, so nothing here is
 * shared between items. They are drawn rather than uploaded: `currentColor`
 * means one set works on the cream card and again on the green one when it's
 * picked, there is nothing to store or serve, and an icon can't 404.
 *
 * Keyed by item slug, falling back to the category. A new item the office adds
 * tomorrow gets its category's mark instead of a hole, which is the whole
 * reason the fallback exists.
 *
 * Everything is on a 24×24 grid, stroked, no fills except where a shape needs
 * to read as solid at 40px. Keep new ones to a handful of paths — these are
 * read at a glance on a phone, not studied.
 */

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A wash behind the line work, so the mark has some weight at small sizes. */
const soft = { fill: "currentColor", opacity: 0.16, stroke: "none" } as const;

const ICONS: Record<string, ReactNode> = {
  /* ── paper ──────────────────────────────────────────────────── */
  newspaper: (
    <>
      <path {...soft} d="M4 6h11v13H4z" />
      <path {...S} d="M15 7h3.5A1.5 1.5 0 0 1 20 8.5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5h11v14" />
      <path {...S} d="M7 8h5M7 11h5M7 14h3" />
    </>
  ),
  "office-paper": (
    <>
      <path {...soft} d="M7 3h7l4 4v12H7z" />
      <path {...S} d="M8 3h6l4 4v13H8z" />
      <path {...S} d="M14 3v4h4" />
      <path {...S} d="M5 6v13a2 2 0 0 0 2 2h9" />
    </>
  ),
  books: (
    <>
      <path {...soft} d="M4 5h6v15H4z" />
      <path {...S} d="M4 4h6v16H4zM11 6l5-1 3 14-5 1z" />
      <path {...S} d="M5.5 8h3" />
    </>
  ),
  cardboard: (
    <>
      <path {...soft} d="M3 9h18v10H3z" />
      <path {...S} d="M3 9h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path {...S} d="M3 9l3-4h12l3 4M12 5v4M9.5 13h5" />
    </>
  ),
  paper: (
    <>
      <path {...soft} d="M6 4h8l4 4v12H6z" />
      <path {...S} d="M6 4h8l4 4v12H6zM14 4v4h4M9 12h6M9 15h4" />
    </>
  ),

  /* ── plastic ────────────────────────────────────────────────── */
  "pet-bottles": (
    <>
      <path {...soft} d="M9 10h6v10H9z" />
      <path {...S} d="M10 3h4v2.5c0 1 1.5 1.8 1.5 3.5V19a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V9c0-1.7 1.5-2.5 1.5-3.5z" />
      <path {...S} d="M8.6 12h6.8" />
    </>
  ),
  "hard-plastic": (
    <>
      <path {...soft} d="M5 8h14l-1.5 11h-11z" />
      <path {...S} d="M4 7h16l-1.7 12.2a1 1 0 0 1-1 .8H6.7a1 1 0 0 1-1-.8z" />
      <path {...S} d="M9 11v5M15 11v5M12 11v5" />
    </>
  ),
  "soft-plastic": (
    <>
      <path {...soft} d="M6 9h12l-1 11H7z" />
      <path {...S} d="M5.5 8h13l-1.2 11.2a1 1 0 0 1-1 .8H7.7a1 1 0 0 1-1-.8z" />
      <path {...S} d="M9 8V5.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  plastic: (
    <>
      <path {...soft} d="M9 9h6v11H9z" />
      <path {...S} d="M10 3h4v2.5c0 1 1.5 1.8 1.5 3.5V19a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V9c0-1.7 1.5-2.5 1.5-3.5z" />
    </>
  ),

  /* ── metal ──────────────────────────────────────────────────── */
  "copper-wire": (
    <>
      <path {...S} d="M4 7c3 0 3 10 6 10s3-10 6-10 3 10 4 10" />
      <path {...S} d="M4 7V5M20 17v2" />
    </>
  ),
  "mixed-copper": (
    <>
      <path {...soft} d="M4 8h16v4H4z" />
      <path {...S} d="M4 8h16v4H4zM6 12v7M12 12v7M18 12v7" />
      <path {...S} d="M4 8V6h16v2" />
    </>
  ),
  brass: (
    <>
      <path {...soft} d="M5 9h8v4H5z" />
      <path {...S} d="M4 9h9v4H4zM13 11h3a3 3 0 0 1 3 3v5" />
      <path {...S} d="M6.5 9V7a2.5 2.5 0 0 1 5 0v2" />
    </>
  ),
  aluminium: (
    <>
      <path {...soft} d="M8 7h8v13H8z" />
      <path {...S} d="M8 4h8v15a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" />
      <path {...S} d="M8 7h8M10.5 4v3" />
    </>
  ),
  "stainless-steel": (
    <>
      <path {...soft} d="M5 9h14l-1 10H6z" />
      <path {...S} d="M4 9h16l-1.2 10.1a1 1 0 0 1-1 .9H6.2a1 1 0 0 1-1-.9z" />
      <path {...S} d="M4 9l2-4h12l2 4" />
    </>
  ),
  "ms-steel": (
    <>
      <path {...soft} d="M5 4h14v3H5zM5 17h14v3H5z" />
      <path {...S} d="M5 4h14v3H5zM5 17h14v3H5zM11 7v10M13 7v10" />
    </>
  ),
  iron: (
    <>
      <path {...soft} d="M4 15h16v5H4z" />
      <path {...S} d="M4 20h16M6 20V9M10 20V5M14 20V9M18 20V12" />
    </>
  ),
  "mixed-metal": (
    <>
      <path {...soft} d="M7 8h10v12H7z" />
      <path {...S} d="M7 8h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
      <path {...S} d="M6 5h12l-1 3H7zM10 12h4" />
    </>
  ),
  metal: (
    <>
      <path {...soft} d="M5 4h14v3H5zM5 17h14v3H5z" />
      <path {...S} d="M5 4h14v3H5zM5 17h14v3H5zM11 7v10M13 7v10" />
    </>
  ),

  /* ── e-waste ────────────────────────────────────────────────── */
  laptop: (
    <>
      <path {...soft} d="M6 5h12v10H6z" />
      <path {...S} d="M6 5h12v10H6zM3 18h18l-1.5 2h-15z" />
    </>
  ),
  "desktop-set": (
    <>
      <path {...soft} d="M13 5h7v11h-7z" />
      <path {...S} d="M13 5h7v11h-7zM15 19h3M16.5 16v3" />
      <path {...S} d="M4 4h6v16H4zM6 7h2M6 10h2" />
    </>
  ),
  monitor: (
    <>
      <path {...soft} d="M3 5h18v10H3z" />
      <path {...S} d="M3 5h18v10H3zM9 19h6M12 15v4" />
    </>
  ),
  mobile: (
    <>
      <path {...soft} d="M8 3h8v18H8z" />
      <path {...S} d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path {...S} d="M10.5 18h3" />
    </>
  ),
  printer: (
    <>
      <path {...soft} d="M4 10h16v7H4z" />
      <path {...S} d="M4 10h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2V9H6v8H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z" />
      <path {...S} d="M7 9V4h10v5M7 14h10v6H7zM17.5 12.5h.5" />
    </>
  ),
  ups: (
    <>
      <path {...soft} d="M5 4h14v16H5z" />
      <path {...S} d="M5 4h14v16H5z" />
      <path {...S} d="M13 8l-3 4.5h2.6L11.5 17l3.3-5h-2.6z" />
    </>
  ),
  "set-top-box": (
    <>
      <path {...soft} d="M3 10h18v6H3z" />
      <path {...S} d="M3 10h18v6H3z" />
      <path {...S} d="M6.5 13h.5M17 13h1M9 10V6l5 4" />
    </>
  ),
  router: (
    <>
      <path {...soft} d="M3 13h18v6H3z" />
      <path {...S} d="M3 13h18v6H3zM6.5 16h.5M9.5 16h.5" />
      <path {...S} d="M8 13V7M16 13V7" />
    </>
  ),
  "mixed-ewaste": (
    <>
      <path {...soft} d="M8 8h8v8H8z" />
      <path {...S} d="M8 8h8v8H8z" />
      <path {...S} d="M11 8V5M14 8V5M11 19v-3M14 19v-3M8 11H5M8 14H5M19 11h-3M19 14h-3" />
    </>
  ),
  shoe: (
    <>
      <path {...soft} d="M3 13h17v5H3z" />
      <path {...S} d="M3 11v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1c0-2-2-2.6-4-3.5L12 11l-2 1.5L3 11z" />
      <path {...S} d="M7 11.5V14M10.5 12.5V15" />
    </>
  ),
  "e-waste": (
    <>
      <path {...soft} d="M8 8h8v8H8z" />
      <path {...S} d="M8 8h8v8H8zM11 8V5M14 8V5M11 19v-3M14 19v-3M8 11H5M8 14H5M19 11h-3M19 14h-3" />
    </>
  ),

  /* ── appliances ─────────────────────────────────────────────── */
  ac: (
    <>
      <path {...soft} d="M3 5h18v7H3z" />
      <path {...S} d="M3 5h18v7H3zM6 9.5h12" />
      <path {...S} d="M7 15c1 1.5 2 1.5 3 0M14 15c1 1.5 2 1.5 3 0M7 18c1 1.5 2 1.5 3 0M14 18c1 1.5 2 1.5 3 0" />
    </>
  ),
  refrigerator: (
    <>
      <path {...soft} d="M6 3h12v18H6z" />
      <path {...S} d="M6 3h12v18H6zM6 10h12M8.5 6v2.5M8.5 12v3" />
    </>
  ),
  "washing-machine": (
    <>
      <path {...soft} d="M4 3h16v18H4z" />
      <path {...S} d="M4 3h16v18H4zM4 7h16" />
      <circle {...S} cx="12" cy="14" r="4" />
      <path {...S} d="M16.5 5h1" />
    </>
  ),
  television: (
    <>
      <path {...soft} d="M3 4h18v12H3z" />
      <path {...S} d="M3 4h18v12H3zM8 20h8M12 16v4" />
    </>
  ),
  microwave: (
    <>
      <path {...soft} d="M3 6h18v12H3z" />
      <path {...S} d="M3 6h18v12H3zM15 6v12M17 9.5h2M17 12h2" />
      <path {...S} d="M6 9.5h6M6 13h4" />
    </>
  ),
  cooler: (
    <>
      <path {...soft} d="M5 3h14v18H5z" />
      <path {...S} d="M5 3h14v18H5z" />
      <circle {...S} cx="12" cy="9" r="3.2" />
      <path {...S} d="M8 16h8M8 18.5h8" />
    </>
  ),
  geyser: (
    <>
      <path {...soft} d="M7 5h10v12H7z" />
      <path {...S} d="M7 7a5 5 0 0 1 10 0v8a5 5 0 0 1-10 0z" />
      <path {...S} d="M12 20v-3M9.5 11h5" />
    </>
  ),
  chimney: (
    <>
      <path {...soft} d="M4 11h16l-2 5H6z" />
      <path {...S} d="M4 12h16l-2.2 4.4a1 1 0 0 1-.9.6H7.1a1 1 0 0 1-.9-.6z" />
      <path {...S} d="M10 12V4h4v8M8 19h8" />
    </>
  ),
  fan: (
    <>
      <circle {...S} cx="12" cy="12" r="2" />
      <path {...S} d="M12 10c0-3 .5-6-2-6s-3 3.5-.6 5M14 12c3 0 6 .5 6-2s-3.5-3-5-.6M10 14c-3 0-6-.5-6 2s3.5 3 5 .6M12 14c0 3-.5 6 2 6s3-3.5.6-5" />
    </>
  ),
  mixer: (
    <>
      <path {...soft} d="M8 4h8v9H8z" />
      <path {...S} d="M8 4h8v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" />
      <path {...S} d="M6 18h12l-1 3H7zM9 14v4M15 14v4" />
    </>
  ),
  appliances: (
    <>
      <path {...soft} d="M6 3h12v18H6z" />
      <path {...S} d="M6 3h12v18H6zM6 10h12M8.5 6v2.5M8.5 12v3" />
    </>
  ),

  /* ── furniture ──────────────────────────────────────────────── */
  almirah: (
    <>
      <path {...soft} d="M5 3h14v17H5z" />
      <path {...S} d="M5 3h14v17H5zM12 3v17M10 11v2M14 11v2M7 20v1M17 20v1" />
    </>
  ),
  bed: (
    <>
      <path {...soft} d="M3 12h18v5H3z" />
      <path {...S} d="M3 17v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5M3 17h18M4 17v3M20 17v3" />
      <path {...S} d="M6 10V8h5v2" />
    </>
  ),
  sofa: (
    <>
      <path {...soft} d="M4 11h16v6H4z" />
      <path {...S} d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      <path {...S} d="M4 11a2 2 0 0 1 2 2v3h12v-3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2z" />
    </>
  ),
  table: (
    <>
      <path {...soft} d="M3 8h18v3H3z" />
      <path {...S} d="M3 8h18v3H3zM6 11v9M18 11v9" />
    </>
  ),
  chair: (
    <>
      <path {...soft} d="M7 12h10v3H7z" />
      <path {...S} d="M7 12V4h2v8M7 12h10v3H7zM8 15v5M16 15v5" />
      <path {...S} d="M9 7h8" />
    </>
  ),
  mattress: (
    <>
      <path {...soft} d="M3 8h18v9H3z" />
      <path {...S} d="M4 8h16a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <path {...S} d="M8 10.5v4M12 10.5v4M16 10.5v4" />
    </>
  ),
  furniture: (
    <>
      <path {...soft} d="M4 11h16v6H4z" />
      <path {...S} d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      <path {...S} d="M4 11a2 2 0 0 1 2 2v3h12v-3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2z" />
    </>
  ),

  /* ── batteries ──────────────────────────────────────────────── */
  "inverter-battery": (
    <>
      <path {...soft} d="M3 7h18v12H3z" />
      <path {...S} d="M3 7h18v12H3zM6 7V5h3v2M15 7V5h3v2" />
      <path {...S} d="M8 13h3M16 13h-3M14.5 11.5v3" />
    </>
  ),
  "ups-battery": (
    <>
      <path {...soft} d="M5 6h14v13H5z" />
      <path {...S} d="M5 6h14v13H5zM8 6V4h2.5v2M14 6V4h2.5v2" />
      <path {...S} d="M8 12.5h2.5M14 12.5h2.5M15.2 11.2v2.6" />
    </>
  ),
  "car-battery": (
    <>
      <path {...soft} d="M3 8h18v11H3z" />
      <path {...S} d="M3 8h18v11H3zM6 8V6h3v2M15 8V6h3v2" />
      <path {...S} d="M7 13h3M14 13h3M15.5 11.5v3" />
    </>
  ),
  batteries: (
    <>
      <path {...soft} d="M3 7h18v12H3z" />
      <path {...S} d="M3 7h18v12H3zM6 7V5h3v2M15 7V5h3v2M8 13h3M16 13h-3M14.5 11.5v3" />
    </>
  ),
};

/** Last resort: an item whose category we don't have a mark for either. */
const FALLBACK: ReactNode = (
  <>
    <path {...soft} d="M4 8h16v11H4z" />
    <path {...S} d="M4 8h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 8l2-4h12l2 4M12 4v4" />
  </>
);

export function ItemIcon({
  slug,
  category,
  className,
}: {
  slug: string;
  /** Category slug, used when the item itself has no mark of its own. */
  category?: string | null;
  className?: string;
}) {
  const art = ICONS[slug] ?? (category ? ICONS[category] : undefined) ?? FALLBACK;

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-full w-full", className)}
      aria-hidden
      focusable="false"
    >
      {art}
    </svg>
  );
}

/** Exported for the self-check — every catalogue slug should find a mark. */
export const ICON_SLUGS = Object.keys(ICONS);
