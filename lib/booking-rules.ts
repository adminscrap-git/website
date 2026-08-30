import type { BookingFull } from "@/lib/db-types";
import { slotStartsAt } from "@/lib/format";

/**
 * The cancellation window, in one place.
 *
 * Both the page (deciding whether to show the button) and the action (deciding
 * whether to honour it) call this. Two copies of this rule would eventually
 * disagree, and the disagreement would look like the button doing nothing.
 */
export type CancelVerdict =
  | { allowed: true }
  | { allowed: false; reason: "already_cancelled" | "already_done" | "too_late" };

export function canCancel(
  booking: Pick<BookingFull, "status" | "pickup_date"> & {
    slot: { start_time: string } | null;
  },
  cutoffHours: number,
  now: Date = new Date(),
): CancelVerdict {
  if (booking.status === "cancelled") return { allowed: false, reason: "already_cancelled" };
  if (booking.status === "picked_up" || booking.status === "completed")
    return { allowed: false, reason: "already_done" };

  if (booking.slot) {
    const opens = slotStartsAt(booking.pickup_date, booking.slot.start_time);
    const cutoff = opens.getTime() - cutoffHours * 3_600_000;
    if (now.getTime() > cutoff) return { allowed: false, reason: "too_late" };
  }

  return { allowed: true };
}

export const CANCEL_MESSAGE: Record<
  Exclude<CancelVerdict, { allowed: true }>["reason"],
  string
> = {
  already_cancelled: "This pickup is already cancelled.",
  already_done: "This pickup has already happened — give us a call if something's wrong.",
  too_late: "It's too close to your window to cancel online. Please call us instead.",
};

/** Rescheduling follows the same window as cancelling. */
export const canReschedule = canCancel;

export const CANCEL_REASONS = [
  "Changed my mind",
  "Not at home that day",
  "Sold it elsewhere",
  "Booked the wrong slot",
  "Something else",
] as const;
