import type { BookingFull, BookingItem } from "@/lib/db-types";
import { STATUS_LABEL, UNIT_SHORT } from "@/lib/db-types";
import { formatDateLong, formatSlot, normalisePhone } from "@/lib/format";

/**
 * WhatsApp via click-to-chat links. No SDK, no API keys, no Meta approval.
 *
 * The customer taps "Send" on a pre-typed message, which also opens the 24h
 * service window so the business can reply freely afterwards.
 *
 * When volume makes that tap the bottleneck, swap in the Meta Cloud API behind
 * `buildBookingMessage` — every caller keeps working.
 */

/** wa.me caps out around 2000 chars in practice; stay well under. */
const MAX_TEXT = 1600;

export function waLink(phone: string, text: string): string {
  const to = normalisePhone(phone);
  const body = text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;
  return `https://wa.me/${to}?text=${encodeURIComponent(body)}`;
}

export function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

/** "Laptop x1, Iron/Loha ~20kg, Refrigerator x1" */
export function summariseItems(
  items: Pick<BookingItem, "name_snapshot" | "qty" | "unit_snapshot">[],
  freeText?: string | null,
): string {
  const listed = items.map((i) => {
    const q = Number(i.qty);
    return i.unit_snapshot === "kg"
      ? `${i.name_snapshot} ~${q}kg`
      : `${i.name_snapshot} x${q} ${UNIT_SHORT[i.unit_snapshot]}`;
  });
  if (freeText?.trim()) listed.push(freeText.trim());
  return listed.length ? listed.join(", ") : "To be confirmed on pickup";
}

type MessageContext = {
  booking: BookingFull;
  /** Absolute /b/[token] URL. */
  trackUrl: string;
  template: string;
};

/** The message the customer sends to the business on confirmation. */
export function buildBookingMessage({
  booking,
  trackUrl,
  template,
}: MessageContext): string {
  return fillTemplate(template, {
    code: booking.code,
    name: booking.name,
    date: formatDateLong(booking.pickup_date),
    slot: booking.slot
      ? `${booking.slot.label} (${formatSlot(booking.slot)})`
      : "",
    items: summariseItems(booking.booking_items, booking.free_text_items),
    address: [booking.address_line, booking.landmark, booking.pincode]
      .filter(Boolean)
      .join(", "),
    maps: booking.maps_url ?? "",
    track: trackUrl,
    status: STATUS_LABEL[booking.status],
  });
}

/** The message the admin sends to the customer on a status change. */
export function buildStatusMessage(ctx: MessageContext): string {
  return buildBookingMessage(ctx);
}
