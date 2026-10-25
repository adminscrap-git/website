"use client";

import { useActionState } from "react";
import Image from "next/image";
import {
  setJobStatus,
  recordSettlement,
  uploadProof,
  deleteProof,
} from "@/app/actions/field";
import type { FormState } from "@/app/actions/field";
import type { BookingStatus, PhotoKind } from "@/lib/db-types";
import { cn } from "@/lib/cn";

type Photo = { id: string; kind: PhotoKind; label: string; url: string };

/**
 * Everything the agent does at the door.
 *
 * One status button at a time, never a picker. On a phone, in a hurry, the
 * only question is "what happens next" — and offering the whole workflow
 * invites a mis-tap that messages the customer something untrue.
 */
const NEXT: Partial<
  Record<BookingStatus, { to: BookingStatus; label: string; hint: string }>
> = {
  assigned: {
    to: "en_route",
    label: "Start — on the way",
    hint: "Tells the customer you have set off.",
  },
  en_route: {
    to: "arrived",
    label: "I'm at the gate",
    hint: "Asks the customer to approve entry with their security desk.",
  },
  arrived: {
    to: "picked_up",
    label: "Scrap collected",
    hint: "Record the weight and payment below first.",
  },
  picked_up: {
    to: "completed",
    label: "Finish job",
    hint: "Sends the customer their receipt.",
  },
};

export function JobControls({
  bookingId,
  status,
  weight,
  amount,
  method,
  photos,
}: {
  bookingId: string;
  status: BookingStatus;
  weight: number | null;
  amount: number | null;
  method: string | null;
  photos: Photo[];
}) {
  const next = NEXT[status];

  return (
    <>
      {next && <StatusAction bookingId={bookingId} next={next} />}

      {/* Shown from "arrived" onwards. Before the van is there these fields
          are only something to mistype. */}
      {["arrived", "picked_up", "completed"].includes(status) && (
        <SettlementForm
          bookingId={bookingId}
          weight={weight}
          amount={amount}
          method={method}
        />
      )}

      <PhotoSection bookingId={bookingId} photos={photos} />
    </>
  );
}

function StatusAction({
  bookingId,
  next,
}: {
  bookingId: string;
  next: { to: BookingStatus; label: string; hint: string };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    setJobStatus,
    {},
  );

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="status" value={next.to} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-toy bg-coral px-6 py-5 text-lg font-extrabold text-ink border-b-[6px] border-coral-deep active:translate-y-[6px] active:border-b-0 disabled:opacity-50"
      >
        {pending ? "Saving…" : next.label}
      </button>
      <p className="mt-2 text-center text-sm font-semibold text-ink-2">
        {next.hint}
      </p>
      <Msg state={state} />
    </form>
  );
}

const inputCls =
  "mt-1.5 w-full rounded-sm border-2 border-paper-3 bg-paper px-3 py-3 text-lg font-bold focus:border-cobalt focus:outline-none";

function SettlementForm({
  bookingId,
  weight,
  amount,
  method,
}: {
  bookingId: string;
  weight: number | null;
  amount: number | null;
  method: string | null;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    recordSettlement,
    {},
  );

  return (
    <form action={action} className="mt-6 rounded-toy bg-paper p-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <h2 className="readout text-[11px] uppercase tracking-[0.14em] text-ink-3">
        What the scale said
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-bold">Weight (kg)</span>
          <input
            name="collected_weight"
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
            defaultValue={weight ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold">Paid</span>
          <input
            name="paid_amount"
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            defaultValue={amount ?? ""}
            className={inputCls}
          />
        </label>
      </div>

      <fieldset className="mt-3">
        <legend className="text-sm font-bold">How</legend>
        <div className="mt-1.5 flex gap-2">
          {["Cash", "UPI"].map((m) => (
            <label key={m} className="flex-1">
              <input
                type="radio"
                name="payment_method"
                value={m}
                defaultChecked={method === m}
                className="peer sr-only"
              />
              <span className="block cursor-pointer rounded-sm border-2 border-paper-3 py-3 text-center text-base font-bold peer-checked:border-cobalt peer-checked:bg-cobalt peer-checked:text-paper">
                {m}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-full border-2 border-ink bg-paper px-5 py-3 text-base font-extrabold disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save figures"}
      </button>
      <Msg state={state} />
    </form>
  );
}

function PhotoSection({
  bookingId,
  photos,
}: {
  bookingId: string;
  photos: Photo[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    uploadProof,
    {},
  );
  const [delState, delAction] = useActionState<FormState, FormData>(
    deleteProof,
    {},
  );

  return (
    <section className="mt-6 rounded-toy bg-paper p-4">
      <h2 className="readout text-[11px] uppercase tracking-[0.14em] text-ink-3">
        Photos
      </h2>

      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="booking_id" value={bookingId} />

        <fieldset>
          <legend className="sr-only">Photo type</legend>
          <div className="flex gap-2">
            {[
              ["scrap", "Scrap"],
              ["payment_proof", "Payment"],
            ].map(([value, label]) => (
              <label key={value} className="flex-1">
                <input
                  type="radio"
                  name="kind"
                  value={value}
                  defaultChecked={value === "scrap"}
                  className="peer sr-only"
                />
                <span className="block cursor-pointer rounded-sm border-2 border-paper-3 py-2.5 text-center text-sm font-bold peer-checked:border-cobalt peer-checked:bg-cobalt peer-checked:text-paper">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* `capture` opens the camera directly on a phone, which is the right
            default here — the picture is being taken now, not found later. */}
        <input
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          required
          className="block w-full text-sm font-semibold file:mr-3 file:rounded-full file:border-0 file:bg-cobalt file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-paper"
        />

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink px-5 py-3 text-base font-extrabold text-paper disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Add photo"}
        </button>
        <Msg state={state} />
      </form>

      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <li key={p.id} className="relative">
              {/* `unoptimized`: these are short-lived signed URLs on a private
                  bucket. Running them through the image optimiser would cache
                  a private photo behind a public, long-lived CDN path. */}
              <Image
                src={p.url}
                alt={p.label}
                width={200}
                height={200}
                unoptimized
                className="aspect-square w-full rounded-sm object-cover"
              />
              <span className="readout absolute left-1 top-1 rounded-full bg-ink/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-paper">
                {p.kind === "payment_proof" ? "paid" : "scrap"}
              </span>
              <form action={delAction}>
                <input type="hidden" name="booking_id" value={bookingId} />
                <input type="hidden" name="photo_id" value={p.id} />
                <button
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-sm font-bold text-paper"
                  aria-label={`Remove ${p.label}`}
                >
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <Msg state={delState} />
    </section>
  );
}

function Msg({ state }: { state: FormState }) {
  if (!state.error && !state.ok) return null;
  return (
    <p
      className={cn(
        "mt-3 rounded-sm px-3 py-2.5 text-sm font-bold",
        state.error
          ? "bg-coral-soft text-coral-deep"
          : "bg-cobalt-soft text-cobalt-deep",
      )}
    >
      {state.error ?? state.ok}
    </p>
  );
}
