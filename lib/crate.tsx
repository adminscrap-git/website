"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * The crate — what the customer has tossed in so far.
 *
 * Stores ONLY item ids and quantities. No prices, no names. Everything shown is
 * resolved against the catalogue the server already sent, and the booking
 * action re-reads prices from the database by id. A tampered localStorage can
 * therefore change what you're booking, never what you're paid.
 *
 * Modelled as an external store rather than useState + useEffect. That's what
 * localStorage actually is, and it buys two things for free: no hydration
 * flicker, and two open tabs staying in sync via the `storage` event.
 */

export type CrateLine = { id: string; qty: number };

const KEY = "mint.crate.v1";
const EMPTY: CrateLine[] = [];

// getSnapshot must return a referentially stable value or React re-renders
// forever, so the parsed array is cached until something invalidates it.
let cache: CrateLine[] | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): CrateLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const clean = parsed.filter(
      (l): l is CrateLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as CrateLine).id === "string" &&
        Number.isFinite((l as CrateLine).qty),
    );
    return clean.length ? clean : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): CrateLine[] {
  if (cache === null) {
    try {
      cache = parse(localStorage.getItem(KEY));
    } catch {
      // Private mode or storage disabled — an empty crate is a fine outcome.
      cache = EMPTY;
    }
  }
  return cache;
}

/** The server has no localStorage, so it always renders an empty crate. */
function getServerSnapshot(): CrateLine[] {
  return EMPTY;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the crate.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      cache = null;
      for (const l of listeners) l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: CrateLine[]) {
  cache = next.length ? next : EMPTY;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage refused. The crate still works for this page view.
  }
  for (const l of listeners) l();
}

function update(fn: (prev: CrateLine[]) => CrateLine[]) {
  write(fn(getSnapshot()));
}

/**
 * Kept as a provider-shaped API so components read like they're in a context.
 * There's no actual context: the store is module-level, which is what makes
 * cross-tab sync work without threading anything through the tree.
 */
export function CrateProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useCrate() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const qtyOf = useCallback(
    (id: string) => lines.find((l) => l.id === id)?.qty ?? 0,
    [lines],
  );

  return useMemo(
    () => ({
      lines,
      count: lines.length,
      qtyOf,
      has: (id: string) => lines.some((l) => l.id === id),
      add: (id: string, qty = 1) =>
        update((prev) =>
          prev.some((l) => l.id === id)
            ? prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l))
            : [...prev, { id, qty }],
        ),
      setQty: (id: string, qty: number) =>
        update((prev) =>
          qty <= 0
            ? prev.filter((l) => l.id !== id)
            : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
        ),
      remove: (id: string) => update((prev) => prev.filter((l) => l.id !== id)),
      clear: () => write(EMPTY),
    }),
    [lines, qtyOf],
  );
}
