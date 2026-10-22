import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Physical button caps. The bottom border is the side of the key; pressing
 * removes it and drops the cap by the same amount, so the button travels
 * rather than fading. No drop shadows anywhere — the edge does the work.
 */

type Variant = "primary" | "cobalt" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  // `coral` is the action green, and only action. Ink on it is 9.2:1 — well past
  // AA, and holds its weight better than white would on a mid-tone green.
  primary:
    "bg-coral text-ink border-b-[5px] border-coral-deep hover:bg-[#34d399] active:bg-coral-deep active:text-paper",
  cobalt:
    "bg-cobalt text-paper border-b-[5px] border-cobalt-deep hover:bg-[#059669] active:bg-cobalt-deep",
  outline:
    "bg-paper text-ink border-2 border-ink border-b-[5px] hover:bg-paper-2 active:bg-paper-3",
  ghost:
    "bg-transparent text-ink border-b-[5px] border-transparent hover:bg-paper-2",
};

const SIZE: Record<Size, string> = {
  sm: "text-sm px-4 py-2 gap-1.5",
  md: "text-base px-6 py-3 gap-2",
  lg: "text-lg sm:text-xl px-8 py-4 gap-2.5",
};

const BASE = cn(
  "inline-flex items-center justify-center rounded-full font-extrabold tracking-tight",
  // No `whitespace-nowrap`: a long label on a 360px phone would push the whole
  // page sideways. Wrapping is centred so a two-line button still looks placed.
  "select-none text-center text-balance",
  "transition-[background-color,transform,border-width] duration-100 ease-out",
  // The travel: lose the edge, move down by it. Feels like a real key.
  "active:translate-y-[5px] active:border-b-0",
  "disabled:pointer-events-none disabled:opacity-45",
);

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(BASE, VARIANT[variant], SIZE[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: CommonProps & React.ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANT[variant], SIZE[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

/** Same look, for the `<a>` cases Link shouldn't own — wa.me, tel:, mailto:. */
export function ButtonAnchor({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(BASE, VARIANT[variant], SIZE[size], className)} {...rest}>
      {children}
    </a>
  );
}
