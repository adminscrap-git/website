import { requireAdmin } from "@/lib/admin-auth";
import { getAllPincodes, getWaitlistByPincode } from "@/lib/admin-queries";
import { Panel } from "@/components/admin/ui";
import { PincodeForm, PincodeRow } from "@/components/admin/ops-forms";

export default async function PincodesPage() {
  await requireAdmin("super_admin");

  const [pincodes, waitlist] = await Promise.all([
    getAllPincodes(),
    getWaitlistByPincode(),
  ]);

  const covered = new Set(pincodes.map((p) => p.pincode));
  const wanted = waitlist.filter((w) => !covered.has(w.pincode));

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <h1 className="display text-4xl">Service area</h1>
        <p className="mt-1.5 max-w-2xl text-base font-semibold text-ink-2">
          The booking form checks this list live. Anyone outside it is asked for
          their number instead of hitting a dead end — that&apos;s the waitlist
          below, and it&apos;s the honest answer to &ldquo;where should we
          expand?&rdquo;
        </p>
      </header>

      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        <Panel
          title={`Collecting from ${pincodes.filter((p) => p.is_active).length} pincodes`}
          description="Pause one to stop taking bookings there without losing the record."
        >
          {pincodes.length === 0 ? (
            <p className="text-sm font-semibold text-ink-3">
              Nothing here yet — nobody can book until you add at least one.
            </p>
          ) : (
            <div className="divide-y divide-paper-3">
              {pincodes.map((p) => (
                <PincodeRow
                  key={p.id}
                  id={p.id}
                  pincode={p.pincode}
                  area={p.area_name}
                  active={p.is_active}
                />
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="Add a pincode">
            <PincodeForm />
          </Panel>

          <Panel
            title="People waiting"
            description="Pincodes we don't cover, most-requested first."
          >
            {wanted.length === 0 ? (
              <p className="text-sm font-semibold text-ink-3">
                Nobody waiting. Every request so far is inside the area.
              </p>
            ) : (
              <ul className="divide-y divide-paper-3">
                {wanted.slice(0, 20).map((w) => (
                  <li key={w.pincode} className="py-2.5">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                        <span className="readout text-sm font-bold">{w.pincode}</span>
                        <span className="readout text-xs text-ink-2">
                          {w.count} {w.count === 1 ? "person" : "people"}
                        </span>
                      </summary>
                      <ul className="mt-2 space-y-1 pl-1">
                        {w.rows.map((r) => (
                          <li key={r.id} className="readout text-xs text-ink-2">
                            <a
                              href={`https://wa.me/${r.phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cobalt underline underline-offset-2"
                            >
                              +{r.phone}
                            </a>
                            {r.name && ` · ${r.name}`}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
