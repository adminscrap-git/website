"use client";

import { useActionState } from "react";
import {
  addPincode,
  deletePincode,
  deleteSlot,
  saveBookingSettings,
  saveBusinessSettings,
  saveSlot,
  saveTemplates,
  togglePincode,
  type FormState,
} from "@/app/actions/admin";
import type {
  BookingSettings,
  BusinessSettings,
  TimeSlot,
} from "@/lib/db-types";
import { AdminField, FormMessage, SubmitButton, adminInput } from "./ui";

/** "09:00:00" -> "09:00", which is what <input type="time"> wants. */
const hhmm = (t: string) => t.slice(0, 5);

export function SlotForm({ slot }: { slot?: TimeSlot }) {
  const [state, action] = useActionState<FormState, FormData>(saveSlot, {});

  return (
    <form action={action} className="space-y-4">
      {slot && <input type="hidden" name="id" value={slot.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Label">
          <input
            name="label"
            required
            defaultValue={slot?.label}
            className={adminInput}
            placeholder="Late morning"
          />
        </AdminField>
        <AdminField
          label="Capacity"
          hint="How many pickups this window can hold on one day."
        >
          <input
            name="capacity"
            type="number"
            min="1"
            required
            defaultValue={slot?.capacity ?? 8}
            className={adminInput}
          />
        </AdminField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminField label="Starts">
          <input
            name="start_time"
            type="time"
            required
            defaultValue={slot ? hhmm(slot.start_time) : "09:00"}
            className={adminInput}
          />
        </AdminField>
        <AdminField label="Ends">
          <input
            name="end_time"
            type="time"
            required
            defaultValue={slot ? hhmm(slot.end_time) : "11:00"}
            className={adminInput}
          />
        </AdminField>
        <AdminField label="Sort order">
          <input
            name="sort_order"
            type="number"
            defaultValue={slot?.sort_order ?? 0}
            className={adminInput}
          />
        </AdminField>
      </div>

      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={slot?.is_active ?? true}
          className="h-5 w-5 accent-[#145a32]"
        />
        <span className="text-sm font-bold">Bookable</span>
      </label>

      <SubmitButton pendingLabel="Saving…">
        {slot ? "Save window" : "Add window"}
      </SubmitButton>

      <FormMessage state={state} />
    </form>
  );
}

export function DeleteSlotButton({ id, label }: { id: string; label: string }) {
  return (
    <form action={deleteSlot}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        variant="danger"
        pendingLabel="Deleting…"
        confirm={`Delete "${label}"? This fails if any booking uses it — untick "Bookable" instead.`}
      >
        Delete
      </SubmitButton>
    </form>
  );
}

export function PincodeForm() {
  const [state, action] = useActionState<FormState, FormData>(addPincode, {});

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Pincode">
          <input
            name="pincode"
            required
            inputMode="numeric"
            maxLength={6}
            className={adminInput}
            placeholder="110024"
          />
        </AdminField>
        <AdminField label="Area name" hint="Optional, for your own reference.">
          <input
            name="area_name"
            className={adminInput}
            placeholder="Lajpat Nagar"
          />
        </AdminField>
      </div>

      <SubmitButton pendingLabel="Adding…">Add pincode</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function PincodeRow({
  id,
  pincode,
  area,
  active,
}: {
  id: string;
  pincode: string;
  area: string | null;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="readout text-sm font-bold">{pincode}</p>
        {area && <p className="text-xs font-semibold text-ink-3">{area}</p>}
      </div>

      <form action={togglePincode}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="next" value={active ? "false" : "true"} />
        <SubmitButton variant="quiet" className="px-3 py-1.5 text-xs">
          {active ? "Pause" : "Resume"}
        </SubmitButton>
      </form>

      <form action={deletePincode}>
        <input type="hidden" name="id" value={id} />
        <SubmitButton
          variant="danger"
          className="px-3 py-1.5 text-xs"
          confirm={`Remove ${pincode} from the service area?`}
        >
          Remove
        </SubmitButton>
      </form>
    </div>
  );
}

export function BusinessForm({ value }: { value: BusinessSettings }) {
  const [state, action] = useActionState<FormState, FormData>(
    saveBusinessSettings,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Business name">
          <input name="name" defaultValue={value.name} className={adminInput} />
        </AdminField>
        <AdminField label="Tagline">
          <input name="tagline" defaultValue={value.tagline} className={adminInput} />
        </AdminField>
        <AdminField label="Service city">
          <input name="city" defaultValue={value.city} className={adminInput} />
        </AdminField>
        <AdminField label="Phone" hint="Shown on the site and used for tel: links.">
          <input name="phone" defaultValue={value.phone} className={adminInput} />
        </AdminField>
        <AdminField
          label="WhatsApp number"
          hint="Digits only, with country code — e.g. 919876543210."
        >
          <input
            name="whatsapp"
            defaultValue={value.whatsapp}
            inputMode="numeric"
            className={adminInput}
          />
        </AdminField>
        <AdminField label="Email">
          <input name="email" type="email" defaultValue={value.email} className={adminInput} />
        </AdminField>
        <AdminField label="Yard address" hint="Optional. Shown on the contact page.">
          <input name="address" defaultValue={value.address} className={adminInput} />
        </AdminField>
        <AdminField label="Yard map link" hint="Optional.">
          <input name="maps_url" defaultValue={value.maps_url} className={adminInput} />
        </AdminField>
      </div>

      <SubmitButton pendingLabel="Saving…">Save business details</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function BookingRulesForm({ value }: { value: BookingSettings }) {
  const [state, action] = useActionState<FormState, FormData>(
    saveBookingSettings,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminField label="Minimum pickup (₹)" hint="Shown up front, not enforced.">
          <input
            name="min_pickup_value"
            type="number"
            min="0"
            defaultValue={value.min_pickup_value}
            className={adminInput}
          />
        </AdminField>
        <AdminField
          label="Cancel cutoff (hours)"
          hint="How long before the window closes self-service cancellation."
        >
          <input
            name="cancel_cutoff_hours"
            type="number"
            min="0"
            defaultValue={value.cancel_cutoff_hours}
            className={adminInput}
          />
        </AdminField>
        <AdminField label="Book ahead (days)" hint="How far out the date picker goes.">
          <input
            name="max_days_ahead"
            type="number"
            min="1"
            max="90"
            defaultValue={value.max_days_ahead}
            className={adminInput}
          />
        </AdminField>
      </div>

      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          name="show_estimate"
          defaultChecked={value.show_estimate}
          className="mt-0.5 h-5 w-5 accent-[#145a32]"
        />
        <span className="text-sm font-bold">
          Show a running estimate to customers
          <span className="block font-semibold text-ink-2">
            Turn this off to publish rates without ever quoting a total.
          </span>
        </span>
      </label>

      <SubmitButton pendingLabel="Saving…">Save booking rules</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function TemplatesForm({
  confirm,
  status,
}: {
  confirm: string;
  status: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveTemplates, {});

  return (
    <form action={action} className="space-y-4">
      <AdminField
        label="Booking confirmation"
        hint="What the customer sends you after booking."
      >
        <textarea
          name="wa_confirm"
          rows={9}
          defaultValue={confirm}
          className={`${adminInput} font-mono text-sm`}
        />
      </AdminField>

      <AdminField
        label="Status update"
        hint="What you send them from a booking's page."
      >
        <textarea
          name="wa_status"
          rows={6}
          defaultValue={status}
          className={`${adminInput} font-mono text-sm`}
        />
      </AdminField>

      <div className="rounded-[14px] bg-paper-2 p-4">
        <p className="readout text-[10px] uppercase tracking-[0.14em] text-ink-2">
          Placeholders
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-ink-2">
          {[
            ["{{code}}", "booking reference"],
            ["{{name}}", "customer name"],
            ["{{date}}", "pickup date"],
            ["{{slot}}", "window"],
            ["{{items}}", "what's being collected"],
            ["{{address}}", "full address"],
            ["{{maps}}", "map link"],
            ["{{track}}", "their booking link"],
            ["{{status}}", "current status"],
          ].map(([k, v]) => (
            <li key={k}>
              <code className="rounded bg-paper px-1.5 py-0.5 font-mono">{k}</code>{" "}
              {v}
            </li>
          ))}
        </ul>
      </div>

      <SubmitButton pendingLabel="Saving…">Save templates</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
