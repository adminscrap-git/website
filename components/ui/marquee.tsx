import { cn } from "@/lib/cn";

/**
 * Endless horizontal band. Pure CSS — the content is rendered twice and the
 * track translates by exactly -50%, so the seam is invisible and there's no
 * JS running on every frame.
 */
export function Marquee({
  children,
  seconds = 32,
  reverse = false,
  className,
}: {
  children: React.ReactNode;
  seconds?: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative flex overflow-hidden", className)}>
      <div
        className="flex w-max shrink-0 items-center will-change-transform"
        style={{
          animation: `marquee ${seconds}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/** One rate on the ticker. */
export function TickerItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="flex items-center gap-3 whitespace-nowrap px-6">
      <span className="text-lg font-extrabold tracking-tight">{label}</span>
      <span className="readout text-lg font-bold text-coral">{value}</span>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-30" />
    </span>
  );
}
