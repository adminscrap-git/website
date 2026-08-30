import { cn } from "@/lib/cn";

/**
 * Form controls. Soft, chunky, cream-filled — inputs read as objects you can
 * press rather than boxes you type into. Focus swaps the fill to paper and
 * lights the border cobalt, so the active field is unmistakable.
 */

const CONTROL = cn(
  "w-full rounded-[18px] bg-paper-2 px-5 py-3.5",
  "text-lg font-semibold text-ink placeholder:text-ink-3 placeholder:font-medium",
  "border-2 border-transparent",
  "transition-colors duration-150",
  "focus:outline-none focus:border-cobalt focus:bg-paper",
  "disabled:opacity-50",
);

const INVALID = "border-coral bg-coral-soft";

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="readout text-[11px] uppercase tracking-[0.14em] text-ink-2 font-medium"
      >
        {label}
        {required && <span className="text-coral-deep"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-sm font-semibold text-coral-deep">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-2">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  invalid,
  className,
  ...rest
}: { invalid?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(CONTROL, invalid && INVALID, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function Textarea({
  invalid,
  className,
  ...rest
}: { invalid?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(CONTROL, "min-h-28 resize-y leading-snug", invalid && INVALID, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...rest
}: { invalid?: boolean } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(CONTROL, "appearance-none cursor-pointer pr-12", invalid && INVALID, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
