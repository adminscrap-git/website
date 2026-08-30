import type { Metadata } from "next";
import { getCatalogue, getSettings } from "@/lib/queries";
import { PickShelf } from "@/components/site/pick-shelf";
import { toyForCategory, type ToyName } from "@/components/three/toy-map";
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
  title: "What we take",
  description:
    "Every category and item we collect, with today's rates. Tap what you've got, then book a free doorstep pickup.",
};

export default async function PickPage() {
  const [catalogue, settings] = await Promise.all([getCatalogue(), getSettings()]);

  // Which toy lands in the crate for each item, resolved once on the server so
  // the client never has to know about the category → toy mapping.
  const toyByItem: Record<string, ToyName> = {};
  for (const cat of catalogue) {
    const toy = toyForCategory(cat.slug);
    for (const item of cat.items) toyByItem[item.id] = toy;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 sm:py-14">
      <header className="max-w-3xl">
        <p className="readout text-[11px] uppercase tracking-[0.18em] text-ink-2">
          The shelf
        </p>
        <h1 className="display mt-4 text-[clamp(2.8rem,9vw,6.5rem)]">
          Tap what&apos;s
          <br />
          <span className="text-cobalt">lying around.</span>
        </h1>
        <p className="mt-6 text-xl font-semibold leading-snug text-ink-2">
          Rough quantities are fine — nobody expects you to weigh your own raddi.
          We&apos;ll confirm everything on a certified scale at your door.
        </p>
        <div className="mt-7">
          <ButtonLink href="/book" variant="outline" size="md">
            Can&apos;t find it? Just book and describe it →
          </ButtonLink>
        </div>
      </header>

      {catalogue.length === 0 ? (
        <p className="mt-20 rounded-toy bg-paper-2 p-10 text-center text-xl font-bold text-ink-2">
          The catalogue is empty. Add categories and items from the admin panel.
        </p>
      ) : (
        <div className="mt-14">
          <PickShelf
            catalogue={catalogue}
            toyByItem={toyByItem}
            showEstimate={settings.booking.show_estimate}
            minPickupValue={settings.booking.min_pickup_value}
          />
        </div>
      )}
    </div>
  );
}
