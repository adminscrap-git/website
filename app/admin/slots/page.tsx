import { requireAdmin } from "@/lib/admin-auth";
import { getAllSlots } from "@/lib/admin-queries";
import { formatSlot } from "@/lib/format";
import { Panel } from "@/components/admin/ui";
import { DeleteSlotButton, SlotForm } from "@/components/admin/ops-forms";
import { cn } from "@/lib/cn";

export default async function SlotsPage() {
  await requireAdmin("super_admin");
  const slots = await getAllSlots();

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="display text-4xl">Pickup windows</h1>
        <p className="mt-1.5 max-w-2xl text-base font-semibold text-ink-2">
          Capacity is per window per day. Once a window fills up, the booking
          form greys it out before anyone wastes time filling in the rest.
        </p>
      </header>

      <div className="mt-8 space-y-3">
        {slots.map((slot) => (
          <details
            key={slot.id}
            className={cn(
              "group rounded-toy border-2 bg-paper p-5",
              slot.is_active ? "border-paper-3" : "border-dashed border-ink-3 opacity-70",
            )}
          >
            <summary className="flex cursor-pointer list-none items-center gap-4 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-extrabold">
                  {slot.label}
                  {!slot.is_active && (
                    <span className="readout ml-2 text-[10px] uppercase tracking-wider text-ink-3">
                      Paused
                    </span>
                  )}
                </span>
                <span className="readout block text-xs text-ink-3">
                  {formatSlot(slot)} · up to {slot.capacity} a day
                </span>
              </span>
              <span
                aria-hidden
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper-2 text-base font-bold transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>

            <div className="mt-5 rounded-[16px] bg-paper-2 p-5">
              <SlotForm slot={slot} />
              <div className="mt-4 border-t border-paper-3 pt-4">
                <DeleteSlotButton id={slot.id} label={slot.label} />
              </div>
            </div>
          </details>
        ))}

        {slots.length === 0 && (
          <p className="rounded-toy bg-paper-2 p-8 text-center text-base font-bold text-ink-2">
            No windows yet — customers can&apos;t book until there&apos;s at
            least one.
          </p>
        )}
      </div>

      <div className="mt-6">
        <Panel title="New window">
          <SlotForm />
        </Panel>
      </div>
    </div>
  );
}
