"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

/**
 * Swiggy-style location chip.
 *
 * Shows where the browser thinks you are, so the rates and service area on the
 * page read as "yours" rather than generic. Display only — it does not gate
 * anything. The real serviceability check is the pincode field on /book, which
 * is matched against `serviceable_pincodes`; this can't replace it, because
 * reverse geocoding returns an area name but an empty postcode for most of
 * India.
 *
 * Deliberately does NOT prompt on load. A cold permission dialog before anyone
 * has asked for anything is the fastest way to get permanently blocked, so the
 * chip only resolves silently when permission was already granted on an earlier
 * visit, and otherwise waits for a tap.
 */

// Keeps the pre-rebrand prefix on purpose: the key is invisible to users,
// and renaming it would silently empty this for everyone who already has one.
const KEY = "mint.place.v1";
/** Long enough that a return visit is instant, short enough to follow a move. */
const MAX_AGE = 12 * 60 * 60 * 1000;

type Place = { label: string; at: number };
/** What the chip is doing right now. The resolved place lives in the store. */
type Status = "idle" | "locating" | "denied" | "failed";

export function LocationChip({ className }: { className?: string }) {
  // Same shape as the crate: localStorage IS the external store, so reading it
  // through useSyncExternalStore avoids both the hydration mismatch a lazy
  // initializer would cause and the cascading render an effect would.
  const place = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [status, setStatus] = useState<Status>("idle");

  const locate = useCallback(async () => {
    setStatus("locating");
    try {
      save({ label: await resolve(), at: Date.now() });
      setStatus("idle");
    } catch (err) {
      const denied =
        typeof GeolocationPositionError !== "undefined" &&
        err instanceof GeolocationPositionError &&
        err.code === err.PERMISSION_DENIED;
      setStatus(denied ? "denied" : "failed");
    }
  }, []);

  useEffect(() => {
    if (place || status !== "idle") return;

    // Only self-start when permission was already granted on an earlier visit.
    // Firefox exposes no Permissions API for geolocation, so an unsupported
    // query just means we wait for a tap — the safe side to fail on.
    let cancelled = false;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((p) => {
        if (!cancelled && p.state === "granted") void locate();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [place, status, locate]);

  const found = place !== null && status === "idle";
  const text = found ? place.label : LABEL[status];
  const busy = status === "locating";

  return (
    <button
      type="button"
      onClick={locate}
      disabled={busy}
      aria-live="polite"
      aria-label={found ? `Your location: ${text}. Tap to update` : "Detect my location"}
      className={cn(
        "group flex min-w-0 items-center gap-1.5 rounded-full px-3 py-2 text-left",
        "transition-colors hover:bg-paper-2 disabled:cursor-wait",
        className,
      )}
    >
      <Pin className={cn("shrink-0 text-cobalt", busy && "animate-pulse")} />
      <span className="min-w-0">
        <span className="readout block text-[9px] uppercase tracking-[0.14em] text-ink-3">
          {found ? "Pickup near" : "Location"}
        </span>
        <span className="block truncate text-[13px] font-bold leading-tight text-ink">
          {text}
        </span>
      </span>
      {/* ml-auto so the chevron parks on the right when the chip is laid out
          as a full-width bar. A shrink-to-fit button has no free space for it
          to claim, so the inline form is unaffected. */}
      <Chevron className="ml-auto shrink-0 text-ink-3 transition-transform group-hover:translate-y-px" />
    </button>
  );
}

const LABEL: Record<Status, string> = {
  idle: "Set location",
  locating: "Locating…",
  denied: "Location blocked",
  failed: "Tap to retry",
};

/* ── store ─────────────────────────────────────────────────────── */

const listeners = new Set<() => void>();
// getSnapshot must return a referentially stable value or React re-renders
// forever, so the parsed place is cached until a save invalidates it.
let cache: Place | null | undefined;

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): Place | null {
  if (cache === undefined) cache = load();
  return cache;
}

/** The server has no localStorage, so it always renders the prompt. */
function getServerSnapshot(): Place | null {
  return null;
}

function save(p: Place) {
  cache = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Private mode. Re-detecting next visit is a fine outcome.
  }
  for (const fn of listeners) fn();
}

/* ── resolution ────────────────────────────────────────────────── */

/**
 * BigDataCloud's reverse-geocode-client endpoint: keyless, CORS-open, and
 * designed to be called from the browser with the user's own coordinates —
 * which is why the coordinates never touch our server.
 */
async function resolve(): Promise<string> {
  const pos = await new Promise<GeolocationPosition>((ok, fail) =>
    navigator.geolocation.getCurrentPosition(ok, fail, {
      // A city-level label does not justify warming up the GPS.
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 10 * 60 * 1000,
    }),
  );

  const { latitude, longitude } = pos.coords;
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
  );
  if (!res.ok) throw new Error(`reverse geocode: ${res.status}`);

  const d: { locality?: string; city?: string; principalSubdivision?: string } =
    await res.json();

  // "Serilingampally, Hyderabad" — but plenty of places return the same string
  // for both, and "Mumbai, Mumbai" looks broken.
  const parts = [d.locality, d.city || d.principalSubdivision].filter(Boolean);
  const label = [...new Set(parts)].join(", ");
  if (!label) throw new Error("reverse geocode: no place name");
  return label;
}

/**
 * Reads and expires the stored place. Called once per page load behind the
 * snapshot cache, which is also why the age check belongs here rather than in
 * the component — `Date.now()` during render is impure, and re-evaluating it
 * on every render would let the label vanish mid-session.
 */
function load(): Place | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p: unknown = JSON.parse(raw);
    const ok =
      typeof p === "object" &&
      p !== null &&
      typeof (p as Place).label === "string" &&
      Number.isFinite((p as Place).at);
    if (!ok) return null;
    return Date.now() - (p as Place).at < MAX_AGE ? (p as Place) : null;
  } catch {
    return null;
  }
}

/* ── glyphs ────────────────────────────────────────────────────── */

function Pin({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 10.5c0 5.5-8 11.5-8 11.5s-8-6-8-11.5a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10.3" r="2.8" />
    </svg>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
