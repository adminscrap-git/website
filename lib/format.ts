import type { Item, TimeSlot, Unit } from "@/lib/db-types";
import { UNIT_LABEL } from "@/lib/db-types";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function rupees(n: number): string {
  return `₹${inr.format(Math.round(n))}`;
}

/** "₹35–₹42" — or a single figure when the admin has set a fixed price. */
export function range(min: number, max: number): string {
  return min === max ? rupees(min) : `${rupees(min)}–${rupees(max)}`;
}

/** "₹35–₹42 per kg" */
export function priceLabel(item: Pick<Item, "price_min" | "price_max" | "unit">): string {
  return `${range(item.price_min, item.price_max)} ${UNIT_LABEL[item.unit]}`;
}

export function unitLabel(unit: Unit): string {
  return UNIT_LABEL[unit];
}

// ── dates ───────────────────────────────────────────────────────────
//
// pickup_date is a plain calendar date ("2026-09-05"), not an instant.
// Everything below formats it from its parts. Passing it through `new Date()`
// would parse as UTC midnight and render as the previous day on any server
// west of Greenwich — a bug that only shows up in production.

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseDateParts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

/** "Sat, 5 Sep" */
export function formatDate(iso: string): string {
  const { y, m, d } = parseDateParts(iso);
  const weekday = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday}, ${d} ${MONTHS[m - 1]}`;
}

/** "Sat, 5 September 2026" */
export function formatDateLong(iso: string): string {
  const { y, m, d } = parseDateParts(iso);
  const weekday = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday}, ${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

/** Today in IST, as "YYYY-MM-DD". The business runs on one clock. */
export function todayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60_000);
  return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}-${String(
    ist.getDate(),
  ).padStart(2, "0")}`;
}

/** Adds whole days to a "YYYY-MM-DD" string, staying in calendar space. */
export function addDays(iso: string, days: number): string {
  const { y, m, d } = parseDateParts(iso);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

// ── times ───────────────────────────────────────────────────────────

/** "09:00:00" -> "9:00 AM" */
export function formatTime(t: string): string {
  const [hRaw, min] = t.split(":");
  const h = Number(hRaw);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${suffix}`;
}

/** "9:00 AM – 11:00 AM" */
export function formatSlot(slot: Pick<TimeSlot, "start_time" | "end_time">): string {
  return `${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`;
}

/** "Morning · 9:00 AM – 11:00 AM" */
export function formatSlotFull(slot: TimeSlot): string {
  return `${slot.label} · ${formatSlot(slot)}`;
}

/**
 * The IST instant a pickup window opens, as a real Date. Used for the
 * cancellation cutoff, which is the one place calendar dates meet the clock.
 */
export function slotStartsAt(pickupDate: string, startTime: string): Date {
  const { y, m, d } = parseDateParts(pickupDate);
  const [h, min] = startTime.split(":").map(Number);
  // IST is UTC+5:30 year-round — no DST to account for.
  return new Date(Date.UTC(y, m - 1, d, h - 5, min - 30));
}

// ── misc ────────────────────────────────────────────────────────────

/** Indian mobile numbers, normalised to wa.me form: 91XXXXXXXXXX. */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(1);
  return digits;
}

export function isValidPhone(raw: string): boolean {
  // Indian mobile numbers start 6-9 and are 10 digits.
  return /^91[6-9]\d{9}$/.test(normalisePhone(raw));
}

export function isValidPincode(raw: string): boolean {
  return /^[1-9]\d{5}$/.test(raw.trim());
}

/** `tel:` href from a human-formatted number — keeps digits and a leading +. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
