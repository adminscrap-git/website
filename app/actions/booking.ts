"use server";

import { sbAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/queries";
import { estimate } from "@/lib/estimate";
import {
  addDays,
  formatDate,
  formatSlot,
  isValidPhone,
  isValidPincode,
  normalisePhone,
  rupees,
  slotStartsAt,
  todayIST,
} from "@/lib/format";
import { enqueue, adminRecipient } from "@/lib/notify";
import { checkServiceArea } from "@/lib/geo";
import { site } from "@/lib/site";
import type { BookingStatus, Item, TimeSlot } from "@/lib/db-types";

export type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; error: string; field?: string };

function fail(error: string, field?: string): ActionResult<never> {
  return { ok: false, error, field };
}

export type NewBookingInput = {
  name: string;
  phone: string;
  email?: string;
  addressLine: string;
  landmark?: string;
  pincode: string;
  mapsUrl?: string;
  /**
   * Resolved by Places autocomplete in the browser when available. Advisory
   * only — the server re-checks the area and never trusts these for anything
   * but saving itself a geocode.
   */
  lat?: number;
  lng?: number;
  pickupDate: string;
  slotId: string;
  /** Item ids and quantities from the crate. Prices are ignored if sent. */
  lines: { id: string; qty: number }[];
  freeTextItems?: string;
  notes?: string;
};

/**
 * Creates a booking.
 *
 * Everything the browser sends about money is discarded. Item prices are read
 * fresh from the database by id and snapshotted onto the booking, so a tampered
 * localStorage can change *what* is being collected but never what it's worth.
 */
export async function createBooking(
  input: NewBookingInput,
): Promise<ActionResult<{ token: string; code: string }>> {
  const db = sbAdmin();
  const { booking: rules } = await getSettings();

  // ── shape ────────────────────────────────────────────────────────
  const name = input.name?.trim();
  const addressLine = input.addressLine?.trim();
  const pincode = input.pincode?.trim();
  const freeText = input.freeTextItems?.trim() || null;

  if (!name || name.length < 2) return fail("Please enter your name.", "name");
  if (!isValidPhone(input.phone ?? ""))
    return fail("Enter a 10-digit Indian mobile number.", "phone");
  if (!addressLine || addressLine.length < 8)
    return fail("Please enter a full pickup address.", "addressLine");
  if (!isValidPincode(pincode ?? ""))
    return fail("Enter a valid 6-digit pincode.", "pincode");

  const lines = (input.lines ?? []).filter(
    (l) => typeof l.id === "string" && Number(l.qty) > 0,
  );
  if (lines.length === 0 && !freeText)
    return fail(
      "Tell us what you'd like collected — pick items, or describe them in the box.",
      "items",
    );

  // ── date window ──────────────────────────────────────────────────
  const today = todayIST();
  const latest = addDays(today, rules.max_days_ahead);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.pickupDate ?? ""))
    return fail("Choose a pickup date.", "pickupDate");
  if (input.pickupDate < today)
    return fail("That date has already passed.", "pickupDate");
  if (input.pickupDate > latest)
    return fail(
      `We only take bookings up to ${rules.max_days_ahead} days ahead.`,
      "pickupDate",
    );

  // ── service area ─────────────────────────────────────────────────
  // A circle on a map, with the pincode list as the fallback — see lib/geo.ts
  // for why both. The client may send coordinates it already resolved through
  // Places autocomplete, which saves a server geocode and is more accurate
  // than re-parsing the typed address.
  const coords =
    Number.isFinite(input.lat) && Number.isFinite(input.lng)
      ? { lat: Number(input.lat), lng: Number(input.lng) }
      : null;

  const area = await checkServiceArea({
    address: [addressLine, input.landmark?.trim(), pincode, "India"]
      .filter(Boolean)
      .join(", "),
    pincode,
    coords,
  });

  if (!area.serviceable)
    return fail(
      "We don't collect from there yet — leave your number and we'll tell you when we do.",
      "pincode",
    );

  // ── slot ─────────────────────────────────────────────────────────
  const { data: slot } = await db
    .from("time_slots")
    .select("*")
    .eq("id", input.slotId)
    .eq("is_active", true)
    .maybeSingle<TimeSlot>();

  if (!slot) return fail("Choose a pickup window.", "slotId");

  // Don't accept a window that has already started today.
  if (input.pickupDate === today) {
    if (slotStartsAt(input.pickupDate, slot.start_time).getTime() < Date.now())
      return fail("That window has already started. Pick a later one.", "slotId");
  }

  const { count: taken } = await db
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("pickup_date", input.pickupDate)
    .eq("slot_id", slot.id)
    .neq("status", "cancelled");

  // ponytail: count-then-insert races under concurrency. At a few dozen
  // bookings a day it cannot happen; add a pg advisory lock on
  // (pickup_date, slot_id) if double-booking ever shows up for real.
  if ((taken ?? 0) >= slot.capacity)
    return fail("That window is full. Try another one.", "slotId");

  // ── abuse guard ──────────────────────────────────────────────────
  const phone = normalisePhone(input.phone);
  const { count: openForPhone } = await db
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .in("status", ["pending", "confirmed"]);

  if ((openForPhone ?? 0) >= 3)
    return fail(
      "You already have three pickups booked. Finish or cancel one first, or call us.",
      "phone",
    );

  // ── prices, read fresh ───────────────────────────────────────────
  type ItemRow = Item & { categories: { name: string } | null };
  let priced: { item: ItemRow; qty: number }[] = [];

  if (lines.length > 0) {
    const { data: items, error } = await db
      .from("items")
      .select("*, categories(name)")
      .in(
        "id",
        lines.map((l) => l.id),
      )
      .eq("is_active", true)
      .returns<ItemRow[]>();

    if (error) return fail("Couldn't price those items. Please try again.");

    const byId = new Map(items?.map((i) => [i.id, i]));
    priced = lines
      .map((l) => ({ item: byId.get(l.id)!, qty: Math.min(Number(l.qty), 9999) }))
      .filter((p) => Boolean(p.item));

    if (priced.length === 0 && !freeText)
      return fail("Those items are no longer available. Please pick again.", "items");
  }

  const totals = estimate(
    priced.map((p) => ({
      qty: p.qty,
      price_min: p.item.price_min,
      price_max: p.item.price_max,
    })),
  );

  // ── write ────────────────────────────────────────────────────────
  const { data: created, error: insertError } = await db
    .from("bookings")
    .insert({
      name,
      phone,
      email: input.email?.trim() || null,
      address_line: addressLine,
      landmark: input.landmark?.trim() || null,
      pincode,
      maps_url:
        input.mapsUrl?.trim() ||
        (coords ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}` : null),
      pickup_date: input.pickupDate,
      slot_id: slot.id,
      free_text_items: freeText,
      estimate_min: totals.min,
      estimate_max: totals.max,
      customer_notes: input.notes?.trim() || null,
    })
    .select("id, token, code")
    .single<{ id: string; token: string; code: string }>();

  if (insertError || !created)
    return fail("Couldn't save your booking. Please try again.");

  if (priced.length > 0) {
    const { error: itemsError } = await db.from("booking_items").insert(
      priced.map((p) => ({
        booking_id: created.id,
        item_id: p.item.id,
        name_snapshot: p.item.name,
        category_name_snapshot: p.item.categories?.name ?? null,
        unit_snapshot: p.item.unit,
        price_min_snapshot: p.item.price_min,
        price_max_snapshot: p.item.price_max,
        qty: p.qty,
      })),
    );
    // A booking with no lines is recoverable by phone; a lost booking is not.
    // Keep the booking and let the admin see the free-text/notes instead.
    if (itemsError) console.error("booking_items insert failed", itemsError);
  }

  await db.from("booking_events").insert({
    booking_id: created.id,
    from_status: null,
    to_status: "pending" satisfies BookingStatus,
    actor: "customer",
    note: "Booking created",
  });

  // ── tell people ──────────────────────────────────────────────────
  // After the booking is safely written, never before. enqueue() swallows its
  // own failures for the same reason: a customer who has booked must not be
  // shown an error because a message could not be queued.
  const itemSummary =
    priced.map((p) => `${p.item.name} x${p.qty}`).join(", ") ||
    freeText ||
    "To be confirmed on pickup";
  const when = `${formatDate(input.pickupDate)}, ${formatSlot(slot)}`;

  await enqueue({
    bookingId: created.id,
    templateKey: "booking_confirmed_customer",
    audience: "customer",
    recipient: phone,
    vars: {
      name,
      code: created.code,
      date: formatDate(input.pickupDate),
      slot: formatSlot(slot),
      items: itemSummary,
      track: `${site.url}/b/${created.token}`,
      when,
    },
  });

  await enqueue({
    bookingId: created.id,
    templateKey: "booking_new_admin",
    audience: "admin",
    recipient: await adminRecipient(),
    vars: {
      code: created.code,
      name,
      phone,
      date: formatDate(input.pickupDate),
      slot: formatSlot(slot),
      address: [addressLine, input.landmark?.trim(), pincode].filter(Boolean).join(", "),
      items: itemSummary,
      estimate:
        totals.max > 0 ? `${rupees(totals.min)}-${rupees(totals.max)}` : "-",
      adminUrl: `${site.url}/admin/bookings/${created.id}`,
    },
  });

  return { ok: true, data: { token: created.token, code: created.code } };
}

/** Out-of-area capture. The only thing we can usefully do with a miss. */
export async function joinWaitlist(input: {
  pincode: string;
  phone: string;
  name?: string;
}): Promise<ActionResult> {
  if (!isValidPincode(input.pincode ?? ""))
    return fail("Enter a valid 6-digit pincode.", "pincode");
  if (!isValidPhone(input.phone ?? ""))
    return fail("Enter a 10-digit Indian mobile number.", "phone");

  const { error } = await sbAdmin().from("waitlist").insert({
    pincode: input.pincode.trim(),
    phone: normalisePhone(input.phone),
    name: input.name?.trim() || null,
  });

  if (error) return fail("Couldn't save that. Please try again.");
  return { ok: true };
}

/**
 * How many places are left in each window on a given date.
 *
 * Called when the customer picks a date, so a full window is greyed out before
 * they fill in the rest of the form rather than after.
 */
export async function slotAvailability(
  pickupDate: string,
): Promise<Record<string, number>> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate ?? "")) return {};

  const db = sbAdmin();
  const [{ data: slots }, { data: booked }] = await Promise.all([
    db.from("time_slots").select("id, capacity").eq("is_active", true),
    db
      .from("bookings")
      .select("slot_id")
      .eq("pickup_date", pickupDate)
      .neq("status", "cancelled"),
  ]);

  const used = new Map<string, number>();
  for (const b of booked ?? []) {
    used.set(b.slot_id, (used.get(b.slot_id) ?? 0) + 1);
  }

  const left: Record<string, number> = {};
  for (const s of slots ?? []) {
    left[s.id] = Math.max(0, s.capacity - (used.get(s.id) ?? 0));
  }
  return left;
}
