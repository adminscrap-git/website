import Link from "next/link";
import { requireAgent } from "@/lib/agent-auth";
import { sbAdmin } from "@/lib/supabase/admin";
import { formatDate, formatSlot, todayIST } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/db-types";
import type { BookingFull } from "@/lib/db-types";

export const dynamic = "force-dynamic";

/**
 * The run sheet.
 *
 * Today first and open jobs only — a finished pickup is history, and an agent
 * standing in a lobby needs the next address, not an archive. Anything still
 * open from a previous day is surfaced at the top as overdue rather than
 * quietly dropped, because those are the ones that go wrong.
 */
export default async function AgentHome() {
  const agent = await requireAgent();
  const today = todayIST();

  const { data } = await sbAdmin()
    .from("bookings")
    .select("*, slot:time_slots(*)")
    .eq("assigned_agent_id", agent.user_id)
    .in("status", ["assigned", "en_route", "arrived", "picked_up"])
    .order("pickup_date", { ascending: true })
    .returns<BookingFull[]>();

  const jobs = data ?? [];
  const overdue = jobs.filter((j) => j.pickup_date < today);
  const todays = jobs.filter((j) => j.pickup_date === today);
  const later = jobs.filter((j) => j.pickup_date > today);

  return (
    <>
      <h1 className="display text-3xl">
        {todays.length > 0
          ? `${todays.length} job${todays.length === 1 ? "" : "s"} today`
          : "Nothing today"}
      </h1>
      <p className="mt-1.5 text-base font-semibold text-ink-2">
        {formatDate(today)}
      </p>

      {jobs.length === 0 && (
        <div className="mt-8 rounded-toy bg-paper p-8 text-center">
          <p className="text-lg font-bold">No jobs assigned yet.</p>
          <p className="mt-2 text-base font-semibold text-ink-2">
            The office will assign pickups to you here.
          </p>
        </div>
      )}

      {overdue.length > 0 && <JobGroup title="Overdue" jobs={overdue} urgent />}
      {todays.length > 0 && <JobGroup title="Today" jobs={todays} />}
      {later.length > 0 && <JobGroup title="Coming up" jobs={later} />}
    </>
  );
}

function JobGroup({
  title,
  jobs,
  urgent,
}: {
  title: string;
  jobs: BookingFull[];
  urgent?: boolean;
}) {
  return (
    <section className="mt-8">
      <h2
        className={`readout text-[11px] uppercase tracking-[0.16em] ${
          urgent ? "text-coral-deep" : "text-ink-3"
        }`}
      >
        {title}
      </h2>
      <ul className="mt-3 space-y-3">
        {jobs.map((j) => (
          <li key={j.id}>
            <Link
              href={`/agent/j/${j.id}`}
              className="block rounded-toy border-2 border-paper-3 bg-paper p-4 active:translate-y-[2px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-extrabold leading-tight">{j.name}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-ink-2">
                    {j.address_line}
                  </p>
                </div>
                <span className="readout shrink-0 rounded-full bg-cobalt-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cobalt-deep">
                  {STATUS_LABEL[j.status]}
                </span>
              </div>
              <p className="readout mt-3 text-xs text-ink-3">
                {j.code} · {formatDate(j.pickup_date)} ·{" "}
                {j.slot ? formatSlot(j.slot) : "TBC"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
