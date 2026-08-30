import type { Metadata } from "next";
import { getCatalogue, getPincodes, getSettings, getSlots } from "@/lib/queries";
import { BookForm } from "@/components/site/book-form";
import { addDays, todayIST } from "@/lib/format";

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
  title: "Book a pickup",
  description:
    "Book a free doorstep scrap pickup. Pick a date and a two-hour window — no signup, cancel any time.",
  robots: { index: false },
};

export default async function BookPage() {
  const [catalogue, slots, pincodes, settings] = await Promise.all([
    getCatalogue(),
    getSlots(),
    getPincodes(),
    getSettings(),
  ]);

  const today = todayIST();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <header>
        <p className="readout text-[11px] uppercase tracking-[0.18em] text-ink-2">
          The counter
        </p>
        <h1 className="display mt-4 text-[clamp(2.6rem,8vw,5rem)]">
          Book your
          <br />
          <span className="text-cobalt">pickup.</span>
        </h1>
        <p className="mt-6 text-xl font-semibold leading-snug text-ink-2">
          No account, no password. You&apos;ll get a private link to track,
          reschedule or cancel it yourself.
        </p>
      </header>

      {slots.length === 0 ? (
        <p className="mt-16 rounded-toy bg-paper-2 p-10 text-center text-xl font-bold text-ink-2">
          No pickup windows are set up yet. Add them from the admin panel.
        </p>
      ) : (
        <BookForm
          catalogue={catalogue}
          slots={slots}
          pincodes={pincodes.map((p) => p.pincode)}
          rules={settings.booking}
          today={today}
          maxDate={addDays(today, settings.booking.max_days_ahead)}
        />
      )}
    </div>
  );
}
