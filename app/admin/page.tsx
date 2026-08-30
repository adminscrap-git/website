import Link from "next/link";
import { requireAdmin, isSuper } from "@/lib/admin-auth";
import { getDashboard } from "@/lib/admin-queries";
import { formatDate, formatSlot, range } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/db-types";
import { Panel, Stat, StatusPill } from "@/components/admin/ui";

export default async function AdminDashboard(props: PageProps<"/admin">) {
  const admin = await requireAdmin();
  const { denied } = await props.searchParams;
  const d = await getDashboard();

  const manage = isSuper(admin);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">
            Morning{admin.full_name ? `, ${admin.full_name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-1.5 text-base font-semibold text-ink-2">
            {d.byStatus.pending} pending ·{" "}
            {d.byStatus.confirmed} confirmed · {d.upcoming.length} coming up
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-extrabold text-paper hover:bg-cobalt"
        >
          All bookings →
        </Link>
      </header>

      {denied !== undefined && (
        <p className="mt-6 rounded-[14px] bg-coral-soft px-4 py-3 text-sm font-bold text-coral-deep">
          That section is super-admin only.
        </p>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Booked today" value={d.today} accent="cobalt" />
        <Stat label="Last 7 days" value={d.week} />
        <Stat label="Last 30 days" value={d.month} />
        <Stat
          label="Cancelled"
          value={d.byStatus.cancelled}
          accent="coral"
          hint="All time"
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-toy bg-cobalt p-6 text-paper">
          <p className="readout text-[10px] uppercase tracking-[0.14em] text-paper/50">
            Open pipeline (estimated)
          </p>
          <p className="readout mt-2 text-3xl font-bold">
            {range(d.estimateOpen.min, d.estimateOpen.max)}
          </p>
          <p className="mt-1 text-xs font-semibold text-paper/60">
            Pending, confirmed and picked-up bookings, at the prices quoted.
          </p>
        </div>
        <div className="rounded-toy bg-ink p-6 text-paper">
          <p className="readout text-[10px] uppercase tracking-[0.14em] text-paper/50">
            Completed (estimated)
          </p>
          <p className="readout mt-2 text-3xl font-bold text-sun">
            {range(d.estimateCompleted.min, d.estimateCompleted.max)}
          </p>
          <p className="mt-1 text-xs font-semibold text-paper/60">
            Estimates at booking, not weighed totals — treat as a floor.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="Coming up" description="Next pickups that still need doing.">
          {d.upcoming.length === 0 ? (
            <p className="text-sm font-semibold text-ink-3">Nothing scheduled.</p>
          ) : (
            <ul className="divide-y divide-paper-3">
              {d.upcoming.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="flex items-center gap-4 py-3 hover:bg-paper-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-extrabold">
                        {b.name}{" "}
                        <span className="readout text-xs font-bold text-ink-3">
                          {b.code}
                        </span>
                      </p>
                      <p className="readout text-xs text-ink-2">
                        {formatDate(b.pickup_date)}
                        {b.slot && ` · ${b.slot.label} ${formatSlot(b.slot)}`} ·{" "}
                        {b.pincode}
                      </p>
                    </div>
                    <StatusPill status={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Activity" description="Every status change, newest first.">
          {d.recent.length === 0 ? (
            <p className="text-sm font-semibold text-ink-3">Nothing yet.</p>
          ) : (
            <ol className="space-y-3">
              {d.recent.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cobalt"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      {e.booking?.code ?? "Booking"} → {STATUS_LABEL[e.to_status]}
                      <span className="ml-1.5 font-semibold text-ink-3">
                        by {e.actor}
                      </span>
                    </p>
                    {e.note && (
                      <p className="truncate text-xs font-semibold text-ink-2">
                        {e.note}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(
          [
            ["Pending", d.byStatus.pending],
            ["Confirmed", d.byStatus.confirmed],
            ["Picked up", d.byStatus.picked_up],
            ["Completed", d.byStatus.completed],
            ["Cancelled", d.byStatus.cancelled],
          ] as const
        ).map(([label, value]) => (
          <Stat key={label} label={label} value={value} />
        ))}
      </div>

      {manage && (
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            ["/admin/catalogue", "Manage catalogue"],
            ["/admin/slots", "Pickup windows"],
            ["/admin/pincodes", "Service area"],
            ["/admin/settings", "Settings"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full bg-paper-2 px-5 py-2.5 text-sm font-extrabold hover:bg-paper-3"
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      <p className="mt-10 text-xs font-semibold text-ink-3">
        Estimates are what was quoted at booking, summed across price ranges.
        The weighed total is settled at the door and isn&apos;t recorded here.
      </p>
    </div>
  );
}
