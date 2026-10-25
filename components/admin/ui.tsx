"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import type { BookingStatus } from "@/lib/db-types";
import { STATUS_LABEL } from "@/lib/db-types";
import type { FormState } from "@/app/actions/admin";

/**
 * Admin chrome. Denser and plainer than the customer site — same palette and
 * type, but tuned for someone working a list of forty pickups on a Tuesday
 * rather than someone being sold to.
 */

export function SubmitButton({
  children,
  pendingLabel,
  variant = "solid",
  className,
  confirm,
  ...rest
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "solid" | "quiet" | "danger";
  confirm?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();

  const styles = {
    solid: "bg-ink text-paper hover:bg-cobalt",
    quiet: "bg-paper-2 text-ink hover:bg-paper-3",
    danger: "bg-transparent text-coral-deep hover:bg-coral-soft",
  }[variant];

  return (
    <button
      type="submit"
      disabled={pending || rest.disabled}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
        rest.onClick?.(e);
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-2.5",
        "text-sm font-extrabold transition-colors disabled:opacity-50",
        styles,
        className,
      )}
      {...rest}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.error && !state.ok) return null;
  return (
    <p
      role="status"
      className={cn(
        "mt-4 rounded-[14px] px-4 py-3 text-sm font-bold",
        state.error ? "bg-coral-soft text-coral-deep" : "bg-cobalt-soft text-cobalt-deep",
      )}
    >
      {state.error ?? state.ok}
    </p>
  );
}

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-sun-soft text-[#8a5a12]",
  confirmed: "bg-cobalt-soft text-cobalt-deep",
  assigned: "bg-cobalt-soft text-cobalt-deep",
  en_route: "bg-coral-soft text-coral-deep",
  // The only status the office may need to act on within minutes — someone is
  // standing at a gate waiting to be let in.
  arrived: "bg-coral text-ink",
  picked_up: "bg-cobalt text-paper",
  completed: "bg-ink text-paper",
  cancelled: "bg-paper-3 text-ink-2 line-through",
};

export function StatusPill({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "readout inline-block rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider",
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-toy border-2 border-paper-3 bg-paper p-6", className)}>
      <h2 className="display text-2xl">{title}</h2>
      {description && (
        <p className="mt-1.5 text-sm font-semibold text-ink-2">{description}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "cobalt" | "coral" | "sun";
}) {
  return (
    <div className="rounded-toy bg-paper-2 p-5">
      <p className="readout text-[10px] uppercase tracking-[0.14em] text-ink-3">
        {label}
      </p>
      <p
        className={cn(
          "display mt-2 text-4xl",
          accent === "cobalt" && "text-cobalt",
          accent === "coral" && "text-coral-deep",
          accent === "sun" && "text-[#8a5a12]",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs font-semibold text-ink-3">{hint}</p>}
    </div>
  );
}

/** Compact labelled input for the dense admin forms. */
export function AdminField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="readout block text-[10px] uppercase tracking-[0.14em] text-ink-2">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs font-semibold text-ink-3">{hint}</span>}
    </label>
  );
}

export const adminInput = cn(
  "w-full rounded-[12px] border-2 border-paper-3 bg-paper px-3.5 py-2.5",
  "text-base font-semibold text-ink placeholder:text-ink-3",
  "focus:border-cobalt focus:outline-none",
);
