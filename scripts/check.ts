/**
 * Self-check for the logic that fails silently.
 *
 *   npm run check
 *
 * Plain asserts, no framework. Everything here is either money, a timezone, or
 * the rule that decides whether someone can cancel — the three places where a
 * wrong answer looks completely normal until it doesn't.
 */
import assert from "node:assert/strict";

import {
  addDays,
  formatDate,
  formatDateLong,
  formatSlot,
  isValidPhone,
  isValidPincode,
  normalisePhone,
  range,
  rupees,
  slotStartsAt,
  todayIST,
} from "../lib/format";
import { estimate } from "../lib/estimate";
import { canCancel } from "../lib/booking-rules";
import { distanceKm } from "../lib/geo-shared";
import { fillTemplate, summariseItems, waLink } from "../lib/whatsapp";
import type { BookingItem, BookingStatus } from "../lib/db-types";

let checks = 0;
function it(name: string, fn: () => void) {
  fn();
  checks++;
  console.log(`  ✓ ${name}`);
}

console.log("\ndates");

it("a calendar date never shifts, whatever the server timezone", () => {
  // The bug this guards: `new Date("2026-09-05")` is UTC midnight, which renders
  // as 4 Sep on any server west of Greenwich. Only shows up in production.
  assert.equal(formatDate("2026-09-05"), "Sat, 5 Sep");
  assert.equal(formatDateLong("2026-09-05"), "Sat, 5 September 2026");
  assert.equal(formatDate("2026-01-01"), "Thu, 1 Jan");
  assert.equal(formatDate("2026-12-31"), "Thu, 31 Dec");
});

it("addDays stays in calendar space across month and year ends", () => {
  assert.equal(addDays("2026-08-30", 2), "2026-09-01");
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2028-03-01", -1), "2028-02-29"); // leap year
});

it("todayIST returns a well-formed date", () => {
  assert.match(todayIST(), /^\d{4}-\d{2}-\d{2}$/);
});

it("a slot start resolves to the right instant in IST", () => {
  // 09:00 IST on 5 Sep is 03:30 UTC the same day.
  assert.equal(
    slotStartsAt("2026-09-05", "09:00:00").toISOString(),
    "2026-09-05T03:30:00.000Z",
  );
  // An early window crosses back over midnight UTC.
  assert.equal(
    slotStartsAt("2026-09-05", "05:00:00").toISOString(),
    "2026-09-04T23:30:00.000Z",
  );
});

it("slot windows format as 12-hour times", () => {
  assert.equal(
    formatSlot({ start_time: "09:00:00", end_time: "11:00:00" }),
    "9:00 AM – 11:00 AM",
  );
  assert.equal(
    formatSlot({ start_time: "12:00:00", end_time: "13:00:00" }),
    "12:00 PM – 1:00 PM",
  );
  assert.equal(
    formatSlot({ start_time: "00:00:00", end_time: "01:00:00" }),
    "12:00 AM – 1:00 AM",
  );
});

console.log("\nmoney");

it("prices format in the Indian numbering system", () => {
  assert.equal(rupees(1200), "₹1,200");
  assert.equal(rupees(150000), "₹1,50,000"); // lakh grouping, not 150,000
});

it("an equal min and max renders as one fixed price", () => {
  assert.equal(range(35, 42), "₹35–₹42");
  assert.equal(range(40, 40), "₹40");
});

it("estimates multiply quantity by both ends of the range", () => {
  assert.deepEqual(
    estimate([
      { qty: 20, price_min: 12, price_max: 18 }, // 240 – 360
      { qty: 1, price_min: 1500, price_max: 4500 }, // 1500 – 4500
    ]),
    { min: 1740, max: 4860 },
  );
  assert.deepEqual(estimate([]), { min: 0, max: 0 });
});

it("a junk quantity contributes nothing rather than NaN", () => {
  assert.deepEqual(
    estimate([{ qty: Number("abc"), price_min: 10, price_max: 20 }]),
    { min: 0, max: 0 },
  );
});

console.log("\nphone numbers");

it("Indian mobile numbers normalise to wa.me form", () => {
  assert.equal(normalisePhone("98765 43210"), "919876543210");
  assert.equal(normalisePhone("+91 98765 43210"), "919876543210");
  assert.equal(normalisePhone("091-9876543210"), "919876543210");
});

it("only real Indian mobile numbers validate", () => {
  assert.ok(isValidPhone("9876543210"));
  assert.ok(isValidPhone("+91 63912 34567"));
  assert.ok(!isValidPhone("1234567890"), "must start 6-9");
  assert.ok(!isValidPhone("98765"), "too short");
  assert.ok(!isValidPhone("5876543210"), "5 is not a valid prefix");
});

it("pincodes reject a leading zero", () => {
  assert.ok(isValidPincode("110024"));
  assert.ok(!isValidPincode("011002"));
  assert.ok(!isValidPincode("11002"));
});

console.log("\ncancellation window");

const slot = { start_time: "09:00:00" };
const at = (iso: string) => new Date(iso);

function booking(status: BookingStatus) {
  return { status, pickup_date: "2026-09-05", slot };
}

it("cancelling is allowed comfortably before the window", () => {
  // Window opens 03:30Z. Two-hour cutoff means 01:30Z is the boundary.
  assert.deepEqual(
    canCancel(booking("pending"), 2, at("2026-09-04T10:00:00Z")),
    { allowed: true },
  );
  assert.deepEqual(
    canCancel(booking("confirmed"), 2, at("2026-09-05T01:00:00Z")),
    { allowed: true },
  );
});

it("cancelling is refused inside the cutoff", () => {
  assert.deepEqual(canCancel(booking("confirmed"), 2, at("2026-09-05T02:00:00Z")), {
    allowed: false,
    reason: "too_late",
  });
  // Same instant, no cutoff configured — still fine until the window opens.
  assert.deepEqual(
    canCancel(booking("confirmed"), 0, at("2026-09-05T02:00:00Z")),
    { allowed: true },
  );
});

it("a finished or already-cancelled pickup can't be cancelled again", () => {
  const early = at("2026-09-01T00:00:00Z");
  assert.deepEqual(canCancel(booking("cancelled"), 2, early), {
    allowed: false,
    reason: "already_cancelled",
  });
  assert.deepEqual(canCancel(booking("picked_up"), 2, early), {
    allowed: false,
    reason: "already_done",
  });
  assert.deepEqual(canCancel(booking("completed"), 2, early), {
    allowed: false,
    reason: "already_done",
  });
});

console.log("\nwhatsapp");

it("templates fill known placeholders and blank unknown ones", () => {
  assert.equal(
    fillTemplate("Booking {{code}} on {{date}}. {{nope}}", {
      code: "MNT-01001",
      date: "5 Sep",
    }),
    "Booking MNT-01001 on 5 Sep. ",
  );
});

it("item summaries read differently for weight and count", () => {
  const items = [
    { name_snapshot: "Newspaper", qty: 20, unit_snapshot: "kg" },
    { name_snapshot: "Laptop", qty: 2, unit_snapshot: "piece" },
  ] as Pick<BookingItem, "name_snapshot" | "qty" | "unit_snapshot">[];

  assert.equal(summariseItems(items), "Newspaper ~20kg, Laptop x2 pcs");
  assert.equal(summariseItems(items, "and a cycle"), "Newspaper ~20kg, Laptop x2 pcs, and a cycle");
  assert.equal(summariseItems([]), "To be confirmed on pickup");
  assert.equal(summariseItems([], "just a fridge"), "just a fridge");
});

it("wa.me links are encoded and length-capped", () => {
  const link = waLink("98765 43210", "Hi MINT — booking MNT-01001");
  assert.ok(link.startsWith("https://wa.me/919876543210?text="));
  assert.ok(link.includes("MNT-01001"));
  assert.ok(!link.includes(" "), "spaces must be percent-encoded");

  const long = waLink("9876543210", "x".repeat(5000));
  assert.ok(decodeURIComponent(long.split("text=")[1]).length <= 1600);
});

it("a 10-digit number from the admin panel still reaches WhatsApp", () => {
  // The bug this guards: wa.me/9398952819 is a valid-looking URL that silently
  // resolves to nothing. It shipped once, from a settings row saved without a
  // country code, so every path that can produce `business.whatsapp` — the env
  // fallback in lib/site.ts and the DB read in getSettings — normalises first.
  assert.equal(normalisePhone("9515321371"), "919515321371");
  assert.equal(normalisePhone("95153 21371"), "919515321371");
  assert.equal(normalisePhone("+91 95153 21371"), "919515321371");
  assert.equal(normalisePhone("919515321371"), "919515321371");
  assert.equal(normalisePhone("09195153 21371"), "919515321371");
});

console.log(`\nservice area`);

it("distance is right between two known Hyderabad points", () => {
  // The bug this guards: a radius check that treats degrees as kilometres, or
  // swaps lat and lng, still returns a plausible number — and the only symptom
  // is real customers being told "we don't collect there".
  const cityCentre = { lat: 17.385, lng: 78.4867 };
  const gachibowli = { lat: 17.4435, lng: 78.3772 };

  const km = distanceKm(cityCentre, gachibowli);
  assert.ok(km > 11 && km < 15, `expected ~13 km, got ${km}`);

  assert.equal(distanceKm(cityCentre, cityCentre), 0);
  // Symmetric, or the answer depends on argument order.
  assert.equal(
    Math.round(distanceKm(gachibowli, cityCentre) * 1000),
    Math.round(km * 1000),
  );
});

it("a 15 km radius covers the suburbs but not the next city", () => {
  const depot = { lat: 17.385, lng: 78.4867 };
  assert.ok(distanceKm(depot, { lat: 17.4435, lng: 78.3772 }) <= 15, "Gachibowli in");
  assert.ok(distanceKm(depot, { lat: 16.5062, lng: 80.648 }) > 15, "Vijayawada out");
});

console.log(`\n${checks} checks passed.\n`);
