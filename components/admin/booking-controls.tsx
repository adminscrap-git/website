"use client";

import { useActionState, useState } from "react";
import { saveAdminNotes, setBookingStatus, type FormState } from "@/app/actions/admin";
import { STATUS_LABEL, type BookingStatus } from "@/lib/db-types";
import { AdminField, FormMessage, SubmitButton, adminInput } from "./ui";

/**
 * Status workflow. Only the transitions that make sense from here are offered —
 * an admin should not be able to mark something completed that was never
 * picked up, and cancelling always demands a reason because the customer
 * reads it on their booking page.
 */
const NEXT: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  // "assigned" is not offered here: it is a consequence of picking an agent,
  // not a button. Assigning one sets it, and unassigning takes it back.
  confirmed: ["assigned", "picked_up", "cancelled"],
  assigned: ["en_route", "picked_up", "confirmed", "cancelled"],
  en_route: ["arrived", "picked_up", "cancelled"],
  arrived: ["picked_up", "cancelled"],
  picked_up: ["completed", "cancelled"],
  completed: [],
  // Restoring a mistakenly cancelled booking is a real need; going straight
  // back to pending makes the customer re-confirm rather than assuming.
  cancelled: ["pending"],
};

export function StatusControls({
  id,
  status,
}: {
  id: string;
  status: BookingStatus;
}) {
  const [state, action] = useActionState<FormState, FormData>(setBookingStatus, {});
  const [cancelling, setCancelling] = useState(false);
  const options = NEXT[status];

  if (options.length === 0) {
    return (
      <p className="text-sm font-semibold text-ink-3">
        This booking is complete. Nothing left to change.
      </p>
    );
  }

  return (
    <div>
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />

        {options
          .filter((s) => s !== "cancelled")
          .map((s) => (
            <SubmitButton key={s} name="status" value={s} pendingLabel="Saving…">
              Mark {STATUS_LABEL[s].toLowerCase()}
            </SubmitButton>
          ))}

        {options.includes("cancelled") && !cancelling && (
          <button
            type="button"
            onClick={() => setCancelling(true)}
            className="rounded-full px-4 py-2.5 text-sm font-bold text-coral-deep underline underline-offset-4 hover:bg-coral-soft"
          >
            Cancel this booking
          </button>
        )}
      </form>

      {cancelling && (
        <form action={action} className="mt-4 rounded-[14px] bg-coral-soft p-4">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="cancelled" />
          <AdminField
            label="Why is this being cancelled?"
            hint="The customer sees this on their booking page."
          >
            <input
              name="note"
              required
              autoFocus
              className={adminInput}
              placeholder="Van broke down — customer rebooked for Thursday"
            />
          </AdminField>
          <div className="mt-3 flex gap-2">
            <SubmitButton variant="danger" pendingLabel="Cancelling…">
              Cancel booking
            </SubmitButton>
            <button
              type="button"
              onClick={() => setCancelling(false)}
              className="rounded-full px-4 py-2.5 text-sm font-bold text-ink-2"
            >
              Keep it
            </button>
          </div>
        </form>
      )}

      <FormMessage state={state} />
    </div>
  );
}

export function AdminNotes({
  id,
  value,
}: {
  id: string;
  value: string | null;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveAdminNotes, {});

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <AdminField label="Internal note" hint="Never shown to the customer.">
        <textarea
          name="admin_notes"
          defaultValue={value ?? ""}
          rows={3}
          className={adminInput}
          placeholder="Called at 10:40, no answer. Trying again after lunch."
        />
      </AdminField>
      <div className="mt-3">
        <SubmitButton variant="quiet" pendingLabel="Saving…">
          Save note
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
