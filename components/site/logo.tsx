import { cn } from "@/lib/cn";

/**
 * The ScrapSquad mark, rebuilt as vector rather than shipped as the raster
 * from the brand kit. It renders in a 24px tab bar and a 220px footer from one
 * file, stays sharp on any display, and costs no network request.
 *
 * Geometry: a dashed outer keyline, a green ring, an orange ring, a cream
 * disc, and three leaves at 120° around an orange centre.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("block", className)}
      role="img"
      aria-label="ScrapSquad"
    >
      {/* dashed keyline */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="var(--color-cobalt)"
        strokeWidth="1.6"
        strokeDasharray="3 3.4"
        strokeLinecap="round"
      />
      {/* green ring */}
      <circle cx="50" cy="50" r="42" fill="var(--color-cobalt)" />
      {/* orange ring */}
      <circle cx="50" cy="50" r="35.5" fill="var(--color-coral)" />
      {/* cream disc */}
      <circle cx="50" cy="50" r="27" fill="var(--color-paper)" />

      {/* Three leaves, one shape rotated. Drawn pointing up from the centre so
          the rotations land at 0/120/240 without a translate. */}
      <g fill="var(--color-cobalt)">
        <Leaf />
        <Leaf rotate={120} />
        <Leaf rotate={240} />
      </g>

      <circle cx="50" cy="50" r="5.4" fill="var(--color-coral)" />
    </svg>
  );
}

function Leaf({ rotate = 0 }: { rotate?: number }) {
  return (
    <path
      d="M50 19c8.5 7.5 11 16 6.5 22-3.5 4.5-9.5 4.5-13 0-4.5-6-2-14.5 6.5-22Z"
      transform={rotate ? `rotate(${rotate} 50 50)` : undefined}
    />
  );
}

/**
 * Mark plus name. `size` drives the mark; the text keys off the current font
 * size, so the lockup scales with whatever context it is dropped into.
 */
export function Wordmark({
  className,
  withTagline = false,
}: {
  className?: string;
  withTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-[0.45em]", className)}>
      <LogoMark className="h-[1.9em] w-[1.9em] shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="display text-[1.25em] leading-none tracking-[-0.03em]">
          ScrapSquad
        </span>
        {withTagline && (
          <span className="mt-[0.35em] text-[0.62em] font-bold leading-none text-coral-deep">
            your scrap, our squad
          </span>
        )}
      </span>
    </span>
  );
}
