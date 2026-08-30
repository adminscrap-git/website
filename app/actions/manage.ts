"use server";

import { revalidatePath } from "next/cache";
import { sbAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/queries";
import { canCancel, CANCEL_MESSAGE } from "@/lib/booking-rules";
import { addDays, slotStartsAt, todayIST } from "@/lib/format";
import type { ActionResult } from "./booking";
import type { BookingFull, TimeSlot } from "@/lib/db-types";

/**
 * Customer-side booking management, authorised entirely by the token.
 *
 * The token is 24 random bytes and is never used as a client-side query filter
 * — every lookup happens here, through the service role, on the server.
 */

const SELECT_FULL =
  "*, slot:time_slots(*), booking_items(*)" as const;

export async function getBookingByToken(
  token: string,
): Promise<BookingFull | null> {
  if (!token || token.length < 20) return null;

  const { data } = await sbAdmin()
    .from("bookings")
    .select(SELECT_FULL)
    .eq("token", token)
    .maybeSingle<BookingFull>();

  return data ?? null;
}

export async function cancelByToken(
  token: string,
  reason: string,
): Promise<ActionResult> {
  const booking = await getBookingByToken(token);
  if (!booking) return { ok: false, error: "We couldn't find that booking." };

  const { booking: rules } = await getSettings();
  const verdict = canCancel(booking, rules.cancel_cutoff_hours);
  if (!verdict.allowed)
    return { ok: false, error: CANCEL_MESSAGE[verdict.reason] };

  const db = sbAdmin();
  const { error } = await db
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: "customer",
      cancel_reason: reason?.trim() || null,
    })
    .eq("id", booking.id);

  if (error) return { ok: false, error: "Couldn't cancel that. Please try again." };

  await db.from("booking_events").insert({
    booking_id: booking.id,
    from_status: booking.status,
    to_status: "cancelled",
    actor: "customer",
    note: reason?.trim() || null,
  });

  revalidatePath(`/b/${token}`);
  return { ok: true };
}

export async function rescheduleByToken(
  token: string,
  pickupDate: string,
  slotId: string,
): Promise<ActionResult> {
  const booking = await getBookingByToken(token);
  if (!booking) return { ok: false, error: "We couldn't find that booking." };

  const { booking: rules } = await getSettings();
  const verdict = canCancel(booking, rules.cancel_cutoff_hours);
  if (!verdict.allowed)
    return { ok: false, error: CANCEL_MESSAGE[verdict.reason] };

  const today = todayIST();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) || pickupDate < today)
    return { ok: false, error: "Choose a date from today onwards.", field: "pickupDate" };
  if (pickupDate > addDays(today, rules.max_days_ahead))
    return {
      ok: false,
      error: `We only take bookings up to ${rules.max_days_ahead} days ahead.`,
      field: "pickupDate",
    };

  const db = sbAdmin();
  const { data: slot } = await db
    .from("time_slots")
    .select("*")
    .eq("id", slotId)
    .eq("is_active", true)
    .maybeSingle<TimeSlot>();

  if (!slot) return { ok: false, error: "Choose a pickup window.", field: "slotId" };

  if (
    pickupDate === today &&
    slotStartsAt(pickupDate, slot.start_time).getTime() < Date.now()
  )
    return { ok: false, error: "That window has already started.", field: "slotId" };

  // Capacity, ignoring this booking's own place in the queue.
  const { count } = await db
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("pickup_date", pickupDate)
    .eq("slot_id", slot.id)
    .neq("status", "cancelled")
    .neq("id", booking.id);

  if ((count ?? 0) >= slot.capacity)
    return { ok: false, error: "That window is full. Try another one.", field: "slotId" };

  const { error } = await db
    .from("bookings")
    .update({ pickup_date: pickupDate, slot_id: slot.id })
    .eq("id", booking.id);

  if (error) return { ok: false, error: "Couldn't move that. Please try again." };

  await db.from("booking_events").insert({
    booking_id: booking.id,
    from_status: booking.status,
    to_status: booking.status,
    actor: "customer",
    note: `Rescheduled to ${pickupDate} (${slot.label})`,
  });

  revalidatePath(`/b/${token}`);
  return { ok: true };
}
