import "server-only";
import { sbAdmin } from "@/lib/supabase/admin";
import { addDays, todayIST } from "@/lib/format";
import type {
  Booking,
  BookingEvent,
  BookingFull,
  BookingStatus,
  Category,
  CategoryWithItems,
  Item,
  Pincode,
  TimeSlot,
} from "@/lib/db-types";

/**
 * Admin reads. All service-role, all server-side.
 *
 * Unlike lib/queries.ts these deliberately ignore `is_active` — an admin needs
 * to see the deactivated rows in order to reactivate them.
 */

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "picked_up",
  "completed",
  "cancelled",
];

export type DashboardData = {
  today: number;
  week: number;
  month: number;
  byStatus: Record<BookingStatus, number>;
  estimateOpen: { min: number; max: number };
  estimateCompleted: { min: number; max: number };
  recent: (BookingEvent & { booking: Pick<Booking, "code" | "name"> | null })[];
  upcoming: (Booking & { slot: TimeSlot | null })[];
};

export async function getDashboard(): Promise<DashboardData> {
  const db = sbAdmin();
  const today = todayIST();
  const weekAgo = addDays(today, -6);
  const monthAgo = addDays(today, -29);

  const countSince = (from: string) =>
    db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${from}T00:00:00+05:30`);

  const [todayC, weekC, monthC, statusRows, moneyRows, events, upcoming] =
    await Promise.all([
      countSince(today),
      countSince(weekAgo),
      countSince(monthAgo),
      // ponytail: both of these read every booking row to total them in JS.
      // Fine at a few thousand; past that, move the aggregation into Postgres
      // (a `select status, count(*), sum(estimate_min)... group by status` view)
      // and read one row instead.
      db.from("bookings").select("status").returns<{ status: BookingStatus }[]>(),
      db
        .from("bookings")
        .select("status, estimate_min, estimate_max")
        .returns<Pick<Booking, "status" | "estimate_min" | "estimate_max">[]>(),
      db
        .from("booking_events")
        .select("*, booking:bookings(code, name)")
        .order("created_at", { ascending: false })
        .limit(12)
        .returns<DashboardData["recent"]>(),
      db
        .from("bookings")
        .select("*, slot:time_slots(*)")
        .gte("pickup_date", today)
        .in("status", ["pending", "confirmed"])
        .order("pickup_date")
        .limit(8)
        .returns<(Booking & { slot: TimeSlot | null })[]>(),
    ]);

  const byStatus = Object.fromEntries(
    STATUSES.map((s) => [s, 0]),
  ) as Record<BookingStatus, number>;
  for (const r of statusRows.data ?? []) byStatus[r.status]++;

  const sum = (match: (s: BookingStatus) => boolean) =>
    (moneyRows.data ?? [])
      .filter((r) => match(r.status))
      .reduce(
        (acc, r) => ({
          min: acc.min + Number(r.estimate_min),
          max: acc.max + Number(r.estimate_max),
        }),
        { min: 0, max: 0 },
      );

  return {
    today: todayC.count ?? 0,
    week: weekC.count ?? 0,
    month: monthC.count ?? 0,
    byStatus,
    // Money still on the road versus money already turned over.
    estimateOpen: sum((s) => s === "pending" || s === "confirmed" || s === "picked_up"),
    estimateCompleted: sum((s) => s === "completed"),
    recent: events.data ?? [],
    upcoming: upcoming.data ?? [],
  };
}

export type BookingFilters = {
  status?: BookingStatus | "all";
  from?: string;
  to?: string;
  q?: string;
  pincode?: string;
};

export async function listBookings(
  filters: BookingFilters,
  limit = 100,
): Promise<(Booking & { slot: TimeSlot | null })[]> {
  let query = sbAdmin()
    .from("bookings")
    .select("*, slot:time_slots(*)")
    .order("pickup_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.from) query = query.gte("pickup_date", filters.from);
  if (filters.to) query = query.lte("pickup_date", filters.to);
  if (filters.pincode) query = query.eq("pincode", filters.pincode);
  if (filters.q) {
    const q = filters.q.replace(/[%,()]/g, "");
    query = query.or(`code.ilike.%${q}%,name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data } = await query.returns<(Booking & { slot: TimeSlot | null })[]>();
  return data ?? [];
}

export async function getBookingById(id: string): Promise<BookingFull | null> {
  const { data } = await sbAdmin()
    .from("bookings")
    .select("*, slot:time_slots(*), booking_items(*)")
    .eq("id", id)
    .maybeSingle<BookingFull>();
  return data ?? null;
}

export async function getBookingEvents(bookingId: string): Promise<BookingEvent[]> {
  const { data } = await sbAdmin()
    .from("booking_events")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .returns<BookingEvent[]>();
  return data ?? [];
}

/** Catalogue including deactivated rows — the admin needs to see those. */
export async function getFullCatalogue(): Promise<CategoryWithItems[]> {
  const { data } = await sbAdmin()
    .from("categories")
    .select("*, items(*)")
    .order("sort_order")
    .order("sort_order", { referencedTable: "items" })
    .returns<CategoryWithItems[]>();
  return data ?? [];
}

export async function getAllCategories(): Promise<Category[]> {
  const { data } = await sbAdmin()
    .from("categories")
    .select("*")
    .order("sort_order")
    .returns<Category[]>();
  return data ?? [];
}

export async function getItem(id: string): Promise<Item | null> {
  const { data } = await sbAdmin()
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle<Item>();
  return data ?? null;
}

export async function getAllSlots(): Promise<TimeSlot[]> {
  const { data } = await sbAdmin()
    .from("time_slots")
    .select("*")
    .order("sort_order")
    .returns<TimeSlot[]>();
  return data ?? [];
}

export async function getAllPincodes(): Promise<Pincode[]> {
  const { data } = await sbAdmin()
    .from("serviceable_pincodes")
    .select("*")
    .order("pincode")
    .returns<Pincode[]>();
  return data ?? [];
}

export type WaitlistRow = {
  id: string;
  pincode: string;
  phone: string;
  name: string | null;
  created_at: string;
};

/** Grouped by pincode — the useful shape is "where are people asking from". */
export async function getWaitlistByPincode(): Promise<
  { pincode: string; count: number; rows: WaitlistRow[] }[]
> {
  const { data } = await sbAdmin()
    .from("waitlist")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<WaitlistRow[]>();

  const groups = new Map<string, WaitlistRow[]>();
  for (const row of data ?? []) {
    const list = groups.get(row.pincode) ?? [];
    list.push(row);
    groups.set(row.pincode, list);
  }

  return [...groups.entries()]
    .map(([pincode, rows]) => ({ pincode, count: rows.length, rows }))
    .sort((a, b) => b.count - a.count);
}
