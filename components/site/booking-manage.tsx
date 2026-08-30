"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cancelByToken, rescheduleByToken } from "@/app/actions/manage";
import { CANCEL_REASONS } from "@/lib/booking-rules";
import { formatSlot } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { TimeSlot } from "@/lib/db-types";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

/**
 * Reschedule and cancel. Both are gated server-side by the same
 * `canCancel` rule the page uses to decide whether to render this at all —
 * this is convenience, not the security boundary.
 */
export function BookingManage({
  token,
  slots,
  currentDate,
  currentSlotId,
  today,
  maxDate,
}: {
  token: string;
  slots: TimeSlot[];
  currentDate: string;
  currentSlotId: string;
  today: string;
  maxDate: string;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<"none" | "move" | "cancel">("none");

  return (
    <div className="mt-10 border-t-2 border-ink pt-8">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(open === "move" ? "none" : "move")}
        >
          {open === "move" ? "Never mind" : "Move it"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-coral-deep underline underline-offset-4"
          onClick={() => setOpen(open === "cancel" ? "none" : "cancel")}
        >
          {open === "cancel" ? "Never mind" : "Cancel this pickup"}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {open === "move" && (
          <Panel key="move" reduced={reduced}>
            <Reschedule
              token={token}
              slots={slots}
              currentDate={currentDate}
              currentSlotId={currentSlotId}
              today={today}
              maxDate={maxDate}
              onDone={() => {
                setOpen("none");
                router.refresh();
              }}
            />
          </Panel>
        )}

        {open === "cancel" && (
          <Panel key="cancel" reduced={reduced}>
            <Cancel token={token} onDone={() => router.refresh()} />
          </Panel>
        )}
      </AnimatePresence>
    </div>
  );
}

function Panel({
  children,
  reduced,
}: {
  children: React.ReactNode;
  reduced: boolean | null;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={reduced ? undefined : { opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="mt-6 rounded-toy bg-paper-2 p-6 sm:p-8">{children}</div>
    </motion.div>
  );
}

function Reschedule({
  token,
  slots,
  currentDate,
  currentSlotId,
  today,
  maxDate,
  onDone,
}: {
  token: string;
  slots: TimeSlot[];
  currentDate: string;
  currentSlotId: string;
  today: string;
  maxDate: string;
  onDone: () => void;
}) {
  const [date, setDate] = useState(currentDate);
  const [slotId, setSlotId] = useState(currentSlotId);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <div>
      <h2 className="display text-2xl">Pick a new time</h2>

      <div className="mt-6 max-w-xs">
        <Field label="Date" htmlFor="newDate">
          <Input
            id="newDate"
            type="date"
            value={date}
            min={today}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSlotId(s.id)}
            aria-pressed={slotId === s.id}
            className={cn(
              "rounded-[18px] border-2 px-4 py-3 text-left transition-colors",
              slotId === s.id
                ? "border-cobalt bg-cobalt text-paper"
                : "border-transparent bg-paper hover:border-ink",
            )}
          >
            <p className="font-extrabold">{s.label}</p>
            <p
              className={cn(
                "readout text-xs",
                slotId === s.id ? "text-paper/70" : "text-ink-3",
              )}
            >
              {formatSlot(s)}
            </p>
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm font-bold text-coral-deep">{error}</p>}

      <Button
        type="button"
        className="mt-7"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError("");
            const res = await rescheduleByToken(token, date, slotId);
            if (res.ok) onDone();
            else setError(res.error);
          })
        }
      >
        {pending ? "Moving…" : "Move my pickup"}
      </Button>
    </div>
  );
}

function Cancel({ token, onDone }: { token: string; onDone: () => void }) {
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <div>
      <h2 className="display text-2xl">Cancel this pickup?</h2>
      <p className="mt-2 text-base font-semibold text-ink-2">
        No charge, no hard feelings. Mind telling us why?
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {CANCEL_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            aria-pressed={reason === r}
            className={cn(
              "rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors",
              reason === r
                ? "border-ink bg-ink text-paper"
                : "border-paper-3 bg-paper text-ink-2 hover:border-ink",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {reason === "Something else" && (
        <div className="mt-5 max-w-md">
          <Field label="Tell us more" htmlFor="cancelDetail">
            <Textarea
              id="cancelDetail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className="min-h-20"
            />
          </Field>
        </div>
      )}

      {error && <p className="mt-4 text-sm font-bold text-coral-deep">{error}</p>}

      <div className="mt-7 flex flex-wrap items-center gap-3">
        {confirming ? (
          <>
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError("");
                  const res = await cancelByToken(
                    token,
                    reason === "Something else" ? detail || reason : reason,
                  );
                  if (res.ok) onDone();
                  else {
                    setError(res.error);
                    setConfirming(false);
                  }
                })
              }
            >
              {pending ? "Cancelling…" : "Yes, cancel it"}
            </Button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-base font-bold text-ink-2 underline underline-offset-4"
            >
              Keep my pickup
            </button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
            Cancel my pickup
          </Button>
        )}
      </div>
    </div>
  );
}
