"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useCrate } from "@/lib/crate";
import { estimate } from "@/lib/estimate";
import { formatDate, formatSlot, range, rupees } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { BookingSettings, CategoryWithItems, Item, TimeSlot } from "@/lib/db-types";
import { createBooking, joinWaitlist, slotAvailability } from "@/app/actions/booking";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

type Errors = Record<string, string>;

export function BookForm({
  catalogue,
  slots,
  pincodes,
  rules,
  today,
  maxDate,
}: {
  catalogue: CategoryWithItems[];
  slots: TimeSlot[];
  pincodes: string[];
  rules: BookingSettings;
  today: string;
  maxDate: string;
}) {
  const router = useRouter();
  const { lines, setQty, clear } = useCrate();
  const reduced = useReducedMotion();
  const [pending, start] = useTransition();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [pickupDate, setPickupDate] = useState(today);
  const [slotId, setSlotId] = useState("");
  const [freeText, setFreeText] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [seatsLeft, setSeatsLeft] = useState<Record<string, number> | null>(null);

  const itemsById = useMemo(() => {
    const m = new Map<string, Item>();
    for (const c of catalogue) for (const i of c.items) m.set(i.id, i);
    return m;
  }, [catalogue]);

  const inCrate = useMemo(
    () =>
      lines
        .map((l) => ({ line: l, item: itemsById.get(l.id) }))
        .filter((x): x is { line: typeof x.line; item: Item } => Boolean(x.item)),
    [lines, itemsById],
  );

  const totals = useMemo(
    () =>
      estimate(
        inCrate.map(({ line, item }) => ({
          qty: line.qty,
          price_min: item.price_min,
          price_max: item.price_max,
        })),
      ),
    [inCrate],
  );

  // Live capacity, so a full window is greyed out before the form is filled in
  // rather than after it's submitted.
  useEffect(() => {
    let stale = false;
    if (!pickupDate) return;
    slotAvailability(pickupDate)
      .then((left) => {
        if (!stale) setSeatsLeft(left);
      })
      .catch(() => setSeatsLeft(null));
    return () => {
      stale = true;
    };
  }, [pickupDate]);

  const pincodeClean = pincode.trim();
  const pincodeComplete = /^[1-9]\d{5}$/.test(pincodeClean);
  const outOfArea = pincodeComplete && !pincodes.includes(pincodeClean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");

    start(async () => {
      const res = await createBooking({
        name,
        phone,
        addressLine,
        landmark,
        pincode: pincodeClean,
        mapsUrl,
        pickupDate,
        slotId,
        lines,
        freeTextItems: freeText,
        notes,
      });

      if (!res.ok) {
        if (res.field) setErrors({ [res.field]: res.error });
        else setFormError(res.error);
        // Take them to the problem rather than making them hunt for it.
        document
          .querySelector(`[data-field="${res.field ?? "form"}"]`)
          ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        return;
      }

      clear();
      router.replace(`/b/${res.data.token}?welcome=1`);
    });
  }

  return (
    <form onSubmit={submit} className="mt-14 space-y-16" noValidate>
      {/* ── 01 what ──────────────────────────────────────────────── */}
      <Section n="01" title="What are we collecting?">
        {inCrate.length > 0 ? (
          <>
            <ul className="divide-y divide-paper-3 rounded-toy bg-paper-2 px-6">
              {inCrate.map(({ line, item }) => (
                <li key={line.id} className="flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-extrabold">{item.name}</p>
                    <p className="readout text-xs text-ink-3">
                      {range(item.price_min, item.price_max)} · {line.qty}
                      {item.unit === "kg" ? "kg" : "×"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQty(line.id, 0)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-ink-2 underline underline-offset-4 hover:text-coral-deep"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            {rules.show_estimate && totals.max > 0 && (
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 rounded-toy bg-cobalt-soft px-6 py-5">
                <p className="text-lg font-extrabold">Rough estimate</p>
                <p className="readout text-2xl font-bold text-cobalt">
                  {range(totals.min, totals.max)}
                </p>
                <p className="w-full text-sm font-semibold text-ink-2">
                  Final amount is whatever the scale says at your door.
                </p>
              </div>
            )}

            <div className="mt-6">
              <Link
                href="/rates"
                className="text-base font-bold text-cobalt underline underline-offset-4"
              >
                ← Add more from the rate card
              </Link>
            </div>
          </>
        ) : (
          <div data-field="items">
            <p className="text-lg font-semibold text-ink-2">
              Nothing picked from the rate card — no problem. Just describe roughly
              what you&apos;ve got and we&apos;ll price it at your door.
            </p>
            <div className="mt-5">
              <Field
                label="What have you got?"
                htmlFor="freeText"
                required
                error={errors.items}
                hint="e.g. two old fridges, a sack of newspapers, some copper wire"
              >
                <Textarea
                  id="freeText"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  invalid={Boolean(errors.items)}
                  placeholder="An old washing machine, about 20kg of raddi, and a broken laptop…"
                />
              </Field>
            </div>
            <p className="mt-4 text-sm font-semibold text-ink-3">
              Prefer to pick from a list?{" "}
              <Link href="/rates" className="text-cobalt underline underline-offset-4">
                Browse the rate card
              </Link>
              .
            </p>
          </div>
        )}

        {inCrate.length > 0 && (
          <div className="mt-6">
            <Field
              label="Anything else we should bring the van for?"
              htmlFor="freeTextExtra"
              hint="Optional — things you couldn't find on the rate card."
            >
              <Textarea
                id="freeTextExtra"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Also a rusted cycle and two car batteries"
                className="min-h-20"
              />
            </Field>
          </div>
        )}
      </Section>

      {/* ── 02 when ──────────────────────────────────────────────── */}
      <Section n="02" title="When suits you?">
        <div data-field="pickupDate" className="max-w-sm">
          <Field label="Pickup date" htmlFor="pickupDate" required error={errors.pickupDate}>
            {/* Native date input: the OS picker is better than anything we'd ship. */}
            <Input
              id="pickupDate"
              type="date"
              value={pickupDate}
              min={today}
              max={maxDate}
              onChange={(e) => setPickupDate(e.target.value)}
              invalid={Boolean(errors.pickupDate)}
            />
          </Field>
        </div>

        <div data-field="slotId" className="mt-8">
          <p className="readout text-[11px] uppercase tracking-[0.14em] text-ink-2">
            Pickup window <span className="text-coral-deep">*</span>
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => {
              const left = seatsLeft?.[slot.id];
              const full = left === 0;
              const chosen = slotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={full}
                  onClick={() => setSlotId(slot.id)}
                  aria-pressed={chosen}
                  className={cn(
                    "rounded-toy border-2 px-5 py-4 text-left transition-colors",
                    chosen
                      ? "border-cobalt bg-cobalt text-paper"
                      : "border-transparent bg-paper-2 hover:border-ink",
                    full && "cursor-not-allowed opacity-40 hover:border-transparent",
                  )}
                >
                  <p className="text-xl font-extrabold">{slot.label}</p>
                  <p
                    className={cn(
                      "readout mt-1 text-xs",
                      chosen ? "text-paper/70" : "text-ink-3",
                    )}
                  >
                    {formatSlot(slot)}
                  </p>
                  {full ? (
                    <p className="readout mt-2 text-[10px] uppercase tracking-wider text-coral-deep">
                      Full
                    </p>
                  ) : left !== undefined && left <= 2 ? (
                    <p
                      className={cn(
                        "readout mt-2 text-[10px] uppercase tracking-wider",
                        chosen ? "text-sun" : "text-coral-deep",
                      )}
                    >
                      {left} left
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
          {errors.slotId && (
            <p className="mt-3 text-sm font-semibold text-coral-deep">{errors.slotId}</p>
          )}
        </div>
      </Section>

      {/* ── 03 where ─────────────────────────────────────────────── */}
      <Section n="03" title="Where are we coming?">
        <div className="grid gap-6 sm:grid-cols-2">
          <div data-field="name">
            <Field label="Your name" htmlFor="name" required error={errors.name}>
              <Input
                id="name"
                value={name}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                invalid={Boolean(errors.name)}
                placeholder="Priya Sharma"
              />
            </Field>
          </div>

          <div data-field="phone">
            <Field
              label="Mobile number"
              htmlFor="phone"
              required
              error={errors.phone}
              hint="We'll call before we set off."
            >
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                invalid={Boolean(errors.phone)}
                placeholder="98765 43210"
              />
            </Field>
          </div>

          <div className="sm:col-span-2" data-field="addressLine">
            <Field label="Pickup address" htmlFor="address" required error={errors.addressLine}>
              <Textarea
                id="address"
                value={addressLine}
                autoComplete="street-address"
                onChange={(e) => setAddressLine(e.target.value)}
                invalid={Boolean(errors.addressLine)}
                placeholder="Flat 402, Sunrise Apartments, Block C, Lajpat Nagar II"
                className="min-h-20"
              />
            </Field>
          </div>

          <Field label="Landmark" htmlFor="landmark" hint="Optional, but it helps.">
            <Input
              id="landmark"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Opposite the Kotak ATM"
            />
          </Field>

          <div data-field="pincode">
            <Field label="Pincode" htmlFor="pincode" required error={errors.pincode}>
              <Input
                id="pincode"
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                invalid={Boolean(errors.pincode) || outOfArea}
                placeholder="110024"
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field
              label="Google Maps link"
              htmlFor="maps"
              hint="Optional. Open Maps → hold your location → Share → Copy link. Saves the driver a phone call."
            >
              <Input
                id="maps"
                type="url"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/…"
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Anything we should know?" htmlFor="notes" hint="Optional.">
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Third floor, no lift. Please call when you reach the gate."
                className="min-h-20"
              />
            </Field>
          </div>
        </div>

        {outOfArea && <WaitlistBox pincode={pincodeClean} phone={phone} name={name} />}
      </Section>

      {/* ── confirm ──────────────────────────────────────────────── */}
      <div data-field="form" className="border-t-2 border-ink pt-10">
        {formError && (
          <p className="mb-6 rounded-toy bg-coral-soft px-6 py-4 text-lg font-bold text-coral-deep">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="display text-2xl">
              {pickupDate ? formatDate(pickupDate) : "Pick a date"}
              {slotId && (
                <span className="text-ink-2">
                  {" · "}
                  {slots.find((s) => s.id === slotId)?.label}
                </span>
              )}
            </p>
            <p className="mt-1 text-base font-semibold text-ink-2">
              Free pickup · Minimum {rupees(rules.min_pickup_value)} · Cancel any
              time up to {rules.cancel_cutoff_hours}h before.
            </p>
          </div>

          <motion.div whileTap={reduced ? undefined : { scale: 0.97 }}>
            <Button
              type="submit"
              size="lg"
              disabled={pending || outOfArea}
              className="w-full sm:w-auto"
            >
              {pending ? "Booking…" : "Confirm booking →"}
            </Button>
          </motion.div>
        </div>
      </div>
    </form>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-4 border-b-2 border-ink pb-4">
        <span className="readout text-sm font-bold text-cobalt">{n}</span>
        <h2 className="display text-[clamp(1.8rem,5vw,3rem)]">{title}</h2>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** The out-of-area path: capture the number instead of showing a dead end. */
function WaitlistBox({
  pincode,
  phone,
  name,
}: {
  pincode: string;
  phone: string;
  name: string;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (done) {
    return (
      <div className="mt-8 rounded-toy bg-cobalt-soft px-6 py-6">
        <p className="display text-2xl">Noted — we&apos;ll message you.</p>
        <p className="mt-2 text-base font-semibold text-ink-2">
          You&apos;re on the list for {pincode}. We expand based on exactly this.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-toy bg-sun-soft px-6 py-6">
      <p className="display text-2xl">We&apos;re not in {pincode} yet.</p>
      <p className="mt-2 max-w-lg text-base font-semibold text-ink-2">
        Leave your number and we&apos;ll tell you the day we start collecting
        there. It&apos;s genuinely how we decide where to go next.
      </p>
      {error && <p className="mt-3 text-sm font-bold text-coral-deep">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await joinWaitlist({ pincode, phone, name });
            if (res.ok) setDone(true);
            else setError(res.error);
          })
        }
        className="mt-5 rounded-full bg-ink px-6 py-3 text-base font-extrabold text-paper disabled:opacity-50"
      >
        {pending ? "Saving…" : "Tell me when you're here"}
      </button>
    </div>
  );
}
