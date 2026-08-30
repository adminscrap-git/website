"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * Scroll-in for editorial blocks. Deliberately restrained: a short rise and a
 * fade, once, never repeating. The 3D does the showing off — text that flies
 * around just makes a page harder to read.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduced = useReducedMotion();
  const M = motion[as];

  if (reduced) return <M className={className}>{children}</M>;

  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -8% 0px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </M>
  );
}

/**
 * Stagger helper for lists — same motion, offset per index, capped so a long
 * list doesn't leave the last item waiting three seconds.
 */
export function RevealList({
  children,
  className,
  step = 0.07,
  max = 6,
}: {
  children: React.ReactNode[];
  className?: string;
  step?: number;
  max?: number;
}) {
  return (
    <div className={cn(className)}>
      {children.map((child, i) => (
        <Reveal key={i} delay={Math.min(i, max) * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
