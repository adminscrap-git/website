import { currentAdmin } from "@/lib/admin-auth";
import { sbAdmin } from "@/lib/supabase/admin";
import { todayIST } from "@/lib/format";
import type { Booking, BookingItem, BookingStatus, TimeSlot } from "@/lib/db-types";

/**
 * CSV export of the current booking filters.
 *
 * Written by hand rather than with a library: it's one escape rule and a join.
 * The BOM matters — without it Excel opens the file as Windows-1252 and every
 * ₹ becomes â‚¹.
 */

const HEADERS = [
  "Code",
  "Status",
  "Booked on",
  "Pickup date",
  "Window",
  "Name",
  "Phone",
  "Email",
  "Address",
  "Landmark",
  "Pincode",
  "Maps link",
  "Items",
  "Described by customer",
  "Estimate min",
  "Estimate max",
  "Customer note",
  "Internal note",
  "Cancelled by",
  "Cancellation reason",
];

/** RFC 4180: quote everything, double any inner quote. */
function cell(v: unknown): string {
  if (v === null || v === undefined) return '""';
  return `"${String(v).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export async function GET(request: Request) {
  // proxy.ts has already established that someone is signed in; this confirms
  // they actually hold an admin profile before handing over customer data.
  const admin = await currentAdmin();
  if (!admin) {
    return new Response("Not authorised", { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const pincode = url.searchParams.get("pincode");
  const q = url.searchParams.get("q");

  type Row = Booking & {
    slot: TimeSlot | null;
    booking_items: Pick<BookingItem, "name_snapshot" | "qty" | "unit_snapshot">[];
  };

  let query = sbAdmin()
    .from("bookings")
    .select("*, slot:time_slots(*), booking_items(name_snapshot, qty, unit_snapshot)")
    .order("pickup_date", { ascending: false })
    .limit(5000);

  if (status && status !== "all") query = query.eq("status", status as BookingStatus);
  if (from) query = query.gte("pickup_date", from);
  if (to) query = query.lte("pickup_date", to);
  if (pincode) query = query.eq("pincode", pincode);
  if (q) {
    const safe = q.replace(/[%,()]/g, "");
    query = query.or(`code.ilike.%${safe}%,name.ilike.%${safe}%,phone.ilike.%${safe}%`);
  }

  const { data, error } = await query.returns<Row[]>();
  if (error) return new Response(`Export failed: ${error.message}`, { status: 500 });

  const lines = [HEADERS.map(cell).join(",")];

  for (const b of data ?? []) {
    lines.push(
      [
        b.code,
        b.status,
        b.created_at.slice(0, 10),
        b.pickup_date,
        b.slot ? `${b.slot.label} ${b.slot.start_time}-${b.slot.end_time}` : "",
        b.name,
        // Leading apostrophe stops Excel eating the number as a float and
        // rendering 9.19999E+11.
        `'+${b.phone}`,
        b.email,
        b.address_line,
        b.landmark,
        b.pincode,
        b.maps_url,
        b.booking_items
          .map((i) => `${i.name_snapshot} x${Number(i.qty)}${i.unit_snapshot === "kg" ? "kg" : ""}`)
          .join("; "),
        b.free_text_items,
        b.estimate_min,
        b.estimate_max,
        b.customer_notes,
        b.admin_notes,
        b.cancelled_by,
        b.cancel_reason,
      ]
        .map(cell)
        .join(","),
    );
  }

  const csv = `﻿${lines.join("\r\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scrapsquad-bookings-${todayIST()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
