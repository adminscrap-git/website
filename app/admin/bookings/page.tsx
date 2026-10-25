import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listBookings, type BookingFilters } from "@/lib/admin-queries";
import { formatDate, formatSlotFull, range } from "@/lib/format";
import type { BookingStatus } from "@/lib/db-types";
import { StatusPill, adminInput } from "@/components/admin/ui";
import { cn } from "@/lib/cn";

const STATUS_TABS: (BookingStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "picked_up",
  "completed",
  "cancelled",
];

const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export default async function BookingsPage(props: PageProps<"/admin/bookings">) {
  await requireAdmin();
  const sp = await props.searchParams;

  const filters: BookingFilters = {
    status: (one(sp.status) as BookingStatus | "all") ?? "all",
    from: one(sp.from),
    to: one(sp.to),
    q: one(sp.q),
    pincode: one(sp.pincode),
  };

  const bookings = await listBookings(filters);

  // Preserve the current filters on the export link so what you download is
  // exactly what you're looking at.
  const exportQuery = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v && v !== "all") as [string, string][],
  ).toString();

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">Bookings</h1>
          <p className="mt-1.5 text-base font-semibold text-ink-2">
            {bookings.length} shown
            {bookings.length === 100 && " (first 100 — narrow the filters)"}
          </p>
        </div>
        <a
          href={`/admin/bookings/export${exportQuery ? `?${exportQuery}` : ""}`}
          className="rounded-full bg-paper-2 px-5 py-2.5 text-sm font-extrabold hover:bg-paper-3"
        >
          Export CSV ↓
        </a>
      </header>

      {/* Plain GET form — filters live in the URL, so they survive a refresh
          and can be shared or bookmarked. No client JS involved. */}
      <form method="get" className="mt-8 rounded-toy bg-paper-2 p-5">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((s) => (
            <Link
              key={s}
              href={`/admin/bookings?status=${s}`}
              className={cn(
                "readout rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-wider transition-colors",
                filters.status === s
                  ? "bg-ink text-paper"
                  : "bg-paper text-ink-2 hover:bg-paper-3",
              )}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </Link>
          ))}
        </div>

        <input type="hidden" name="status" value={filters.status} />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Code, name or phone"
            className={cn(adminInput, "lg:col-span-2")}
          />
          <input
            name="pincode"
            defaultValue={filters.pincode ?? ""}
            placeholder="Pincode"
            inputMode="numeric"
            className={adminInput}
          />
          <input
            name="from"
            type="date"
            defaultValue={filters.from ?? ""}
            aria-label="Pickup date from"
            className={adminInput}
          />
          <input
            name="to"
            type="date"
            defaultValue={filters.to ?? ""}
            aria-label="Pickup date to"
            className={adminInput}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button className="rounded-full bg-ink px-5 py-2.5 text-sm font-extrabold text-paper hover:bg-cobalt">
            Apply
          </button>
          <Link
            href="/admin/bookings"
            className="rounded-full px-5 py-2.5 text-sm font-bold text-ink-2 underline underline-offset-4"
          >
            Clear
          </Link>
        </div>
      </form>

      {bookings.length === 0 ? (
        <p className="mt-10 rounded-toy bg-paper-2 p-10 text-center text-lg font-bold text-ink-2">
          No bookings match that.
        </p>
      ) : (
        <>
          {/* Phone: one tappable card per booking. A six-column table that
              scrolls sideways is unusable one-handed, and this list is the
              thing the owner actually checks on the move. */}
          <ul className="mt-6 space-y-2 md:hidden">
            {bookings.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/admin/bookings/${b.id}`}
                  className="block rounded-toy border-2 border-paper-3 bg-paper p-4 active:bg-paper-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-extrabold">{b.name}</p>
                      <p className="readout text-xs text-ink-3">
                        {b.code} · +{b.phone}
                      </p>
                    </div>
                    <StatusPill status={b.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-paper-3 pt-3">
                    <p className="text-sm font-bold">
                      {formatDate(b.pickup_date)}
                      {b.slot && (
                        <span className="font-semibold text-ink-2"> · {b.slot.label}</span>
                      )}
                    </p>
                    <p className="readout text-xs text-ink-3">{b.pincode}</p>
                    {b.estimate_max > 0 && (
                      <p className="readout w-full text-sm font-bold">
                        {range(b.estimate_min, b.estimate_max)}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="readout border-b-2 border-ink text-[10px] uppercase tracking-[0.14em] text-ink-2">
                <th className="py-3 pr-4 font-medium">Code</th>
                <th className="py-3 pr-4 font-medium">Customer</th>
                <th className="py-3 pr-4 font-medium">Pickup</th>
                <th className="py-3 pr-4 font-medium">Area</th>
                <th className="py-3 pr-4 text-right font-medium">Estimate</th>
                <th className="py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-3">
              {bookings.map((b) => (
                <tr key={b.id} className="group hover:bg-paper-2">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="readout text-sm font-bold text-cobalt underline-offset-4 group-hover:underline"
                    >
                      {b.code}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-sm font-extrabold">{b.name}</p>
                    <p className="readout text-xs text-ink-3">+{b.phone}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-sm font-bold">{formatDate(b.pickup_date)}</p>
                    <p className="readout text-xs text-ink-3">
                      {b.slot ? formatSlotFull(b.slot) : "—"}
                    </p>
                  </td>
                  <td className="readout py-3 pr-4 text-sm">{b.pincode}</td>
                  <td className="readout py-3 pr-4 text-right text-sm font-bold">
                    {b.estimate_max > 0
                      ? range(b.estimate_min, b.estimate_max)
                      : "—"}
                  </td>
                  <td className="py-3 text-right">
                    <StatusPill status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
