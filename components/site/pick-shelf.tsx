"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCrate } from "@/lib/crate";
import { estimate } from "@/lib/estimate";
import { range, rupees, unitLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CategoryWithItems, Item } from "@/lib/db-types";
import type { ToyName } from "@/components/three/toy-map";
import { CrateScene } from "@/components/three/crate-scene";
import { ButtonLink } from "@/components/ui/button";

/** kg items step in fives — nobody sells one kilo of newspaper. */
const step = (item: Item) => (item.unit === "kg" ? 5 : 1);

export function PickShelf({
  catalogue,
  toyByItem,
  showEstimate,
  minPickupValue,
}: {
  catalogue: CategoryWithItems[];
  toyByItem: Record<string, ToyName>;
  showEstimate: boolean;
  minPickupValue: number;
}) {
  const { lines, qtyOf, add, setQty, count } = useCrate();
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

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

  const toys = useMemo(
    () => inCrate.map(({ line }) => toyByItem[line.id] ?? "crate"),
    [inCrate, toyByItem],
  );

  const belowMinimum = showEstimate && totals.max > 0 && totals.max < minPickupValue;

  return (
    <>
      {/* jump nav */}
      <nav className="sticky top-[var(--header-h)] z-30 -mx-5 mb-10 overflow-x-auto bg-paper px-5 py-3 sm:-mx-8 sm:px-8">
        <ul className="flex w-max gap-2">
          {catalogue.map((c) => (
            <li key={c.id}>
              <a
                href={`#${c.slug}`}
                className="block rounded-full bg-paper-2 px-4 py-2 text-sm font-bold text-ink-2 transition-colors hover:bg-ink hover:text-paper"
              >
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Only reserve room for the dock when the dock is actually there —
          otherwise an empty crate leaves a screen of dead space. */}
      <div className={cn("space-y-20", count > 0 ? "pb-72 lg:pb-80" : "pb-16")}>
        {catalogue.map((cat) => (
          <section key={cat.id} id={cat.slug} className="scroll-mt-40">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b-2 border-ink pb-4">
              <h2 className="display text-[clamp(2.2rem,6vw,4rem)]">{cat.name}</h2>
              <p className="readout text-[11px] uppercase tracking-[0.14em] text-ink-3">
                {cat.items.length} items
              </p>
            </div>
            {cat.description && (
              <p className="mt-4 max-w-2xl text-lg font-semibold text-ink-2">
                {cat.description}
              </p>
            )}

            <ul className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {cat.items.map((item) => {
                const qty = qtyOf(item.id);
                const picked = qty > 0;
                return (
                  <motion.li
                    key={item.id}
                    layout={!reduced}
                    className={cn(
                      "flex flex-col justify-between rounded-toy border-2 p-6 transition-colors",
                      picked
                        ? "border-cobalt bg-cobalt-soft"
                        : "border-transparent bg-paper-2",
                    )}
                  >
                    <div>
                      <div className="flex items-start gap-4">
                        {item.photo_url && (
                          <Image
                            src={item.photo_url}
                            alt=""
                            width={72}
                            height={72}
                            sizes="72px"
                            className="h-18 w-18 shrink-0 rounded-[16px] bg-paper object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="display text-2xl">{item.name}</h3>
                          {item.note && (
                            <p className="mt-1.5 text-sm font-semibold text-ink-2">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="readout mt-4 text-lg font-bold text-ink">
                        {range(item.price_min, item.price_max)}
                        <span className="ml-2 text-[11px] uppercase tracking-[0.12em] text-ink-3">
                          {unitLabel(item.unit)}
                        </span>
                      </p>
                    </div>

                    <div className="mt-6">
                      {picked ? (
                        <div className="flex items-center gap-2">
                          <Stepper
                            value={qty}
                            unit={item.unit}
                            onChange={(v) => setQty(item.id, v)}
                            step={step(item)}
                          />
                          <button
                            type="button"
                            onClick={() => setQty(item.id, 0)}
                            className="ml-auto rounded-full px-3 py-2 text-sm font-bold text-ink-2 underline underline-offset-4 hover:text-coral-deep"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => add(item.id, step(item))}
                          className={cn(
                            "w-full rounded-full bg-ink px-5 py-3 text-base font-extrabold text-paper",
                            "border-b-[5px] border-ink-2 transition-transform duration-100",
                            "active:translate-y-[5px] active:border-b-0 hover:bg-cobalt hover:border-cobalt-deep",
                          )}
                        >
                          + Toss it in
                        </button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* ── the crate dock ─────────────────────────────────────── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.aside
            initial={reduced ? false : { y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            // Sits above the tab bar, and stops short of the right edge so it
            // never lands under the floating action rail.
            className={cn(
              "fixed z-40 bottom-[calc(var(--bottombar-h)+0.75rem)]",
              "left-3 right-20 sm:left-5 sm:right-24",
              "lg:left-auto lg:right-24 lg:w-[380px]",
            )}
            aria-label="Your crate"
          >
            <div className="overflow-hidden rounded-toy border-2 border-ink bg-paper">
              {/* 3D only where there's room and power for it */}
              <div className="hidden lg:block">
                <CrateScene toys={toys} className="h-44 w-full bg-cobalt-soft" />
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="readout text-[11px] uppercase tracking-[0.14em] text-ink-3">
                      In your crate
                    </p>
                    <p className="display mt-1 text-3xl">
                      {count} {count === 1 ? "thing" : "things"}
                    </p>
                  </div>
                  {showEstimate && totals.max > 0 && (
                    <div className="text-right">
                      <p className="readout text-[11px] uppercase tracking-[0.14em] text-ink-3">
                        Rough estimate
                      </p>
                      <p className="readout mt-1 text-xl font-bold text-cobalt">
                        {range(totals.min, totals.max)}
                      </p>
                    </div>
                  )}
                </div>

                {expanded && (
                  <ul className="mt-4 max-h-48 space-y-1.5 overflow-y-auto border-t border-paper-3 pt-4">
                    {inCrate.map(({ line, item }) => (
                      <li
                        key={line.id}
                        className="flex items-center justify-between gap-3 text-sm font-bold"
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="readout shrink-0 text-ink-2">
                          {line.qty}
                          {item.unit === "kg" ? "kg" : "×"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {belowMinimum && (
                  <p className="mt-4 rounded-[14px] bg-sun-soft px-4 py-3 text-sm font-semibold text-ink">
                    Our minimum pickup is {rupees(minPickupValue)}. Add a bit more,
                    or book anyway and we&apos;ll call to sort it out.
                  </p>
                )}

                <div className="mt-5 flex items-center gap-3">
                  <ButtonLink href="/book" size="md" className="flex-1">
                    Book pickup →
                  </ButtonLink>
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="rounded-full px-3 py-2 text-sm font-bold text-ink-2 underline underline-offset-4"
                  >
                    {expanded ? "Hide" : "See all"}
                  </button>
                </div>

                {showEstimate && (
                  <p className="mt-3 text-[11px] font-semibold leading-snug text-ink-3">
                    An estimate, not a quote — the real number comes off the scale
                    at your door.
                  </p>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* The empty-crate prompt that used to be pinned here is gone: it sat at
          bottom-0, which is now the tab bar, and it said the same thing as the
          page header's "describe it instead" and the Book tab. */}
    </>
  );
}

function Stepper({
  value,
  unit,
  step,
  onChange,
}: {
  value: number;
  unit: Item["unit"];
  step: number;
  onChange: (v: number) => void;
}) {
  const suffix = unit === "kg" ? "kg" : "";
  return (
    <div className="flex items-center gap-1 rounded-full bg-paper p-1">
      <StepButton label={`Less ${suffix}`} onClick={() => onChange(value - step)}>
        −
      </StepButton>
      <span className="readout min-w-14 text-center text-base font-bold">
        {value}
        {suffix}
      </span>
      <StepButton label={`More ${suffix}`} onClick={() => onChange(value + step)}>
        +
      </StepButton>
    </div>
  );
}

function StepButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full bg-ink text-xl font-bold leading-none text-paper transition-transform active:scale-90"
    >
      {children}
    </button>
  );
}
