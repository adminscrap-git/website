import "server-only";
import { sbAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/queries";
import { distanceKm as dist, type LatLng } from "@/lib/geo-shared";

/**
 * Where we collect from.
 *
 * The service area is a circle: a depot pin and a radius, set on a map in the
 * admin. That replaces the hand-maintained pincode list, which could only ever
 * be as complete as the last person to edit it.
 *
 * It does NOT delete the pincode list. Geocoding needs a Google key and a
 * working network, and an address Google cannot place is not the customer's
 * fault — so when the circle cannot be evaluated, the old list decides instead.
 * Turning away real business because an API was down is the one outcome worth
 * engineering against here.
 */

export { distanceKm } from "@/lib/geo-shared";
export type { LatLng } from "@/lib/geo-shared";

/**
 * Address → coordinates, server-side.
 *
 * Deliberately not the browser key: this runs with GOOGLE_MAPS_SERVER_KEY if
 * present so the restricted public key is never used for billable server
 * lookups, falling back to the public one so a single key still works.
 */
export async function geocode(address: string): Promise<LatLng | null> {
  const key =
    process.env.GOOGLE_MAPS_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key || !address.trim()) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    // Biasing to India stops "Hyderabad" resolving to Hyderabad, Pakistan.
    url.searchParams.set("region", "in");
    url.searchParams.set("components", "country:IN");
    url.searchParams.set("key", key);

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      status?: string;
      results?: { geometry?: { location?: LatLng } }[];
    };
    if (json.status !== "OK") return null;

    const loc = json.results?.[0]?.geometry?.location;
    return loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng) ? loc : null;
  } catch {
    // Timeout, DNS, quota. The caller falls back to pincodes.
    return null;
  }
}

export type AreaCheck = {
  serviceable: boolean;
  /** How the answer was reached, so the UI can explain itself honestly. */
  via: "radius" | "pincode" | "unknown";
  distanceKm?: number;
};

/**
 * The one serviceability question, asked in one place.
 *
 * Order matters: the circle is the real rule, the pincode list is the safety
 * net. A hit on either is a yes, because every path to "no" here is a lost
 * customer and we would rather send a van somewhere awkward than refuse
 * someone we actually cover.
 */
export async function checkServiceArea(input: {
  address: string;
  pincode: string;
  coords?: LatLng | null;
}): Promise<AreaCheck> {
  const { area } = await getSettings();

  const point = input.coords ?? (await geocode(input.address));

  if (point) {
    const km = dist(point, { lat: area.depot_lat, lng: area.depot_lng });
    if (km <= area.radius_km) {
      return { serviceable: true, via: "radius", distanceKm: km };
    }
    // Outside the circle, but an explicitly listed pincode still wins — that
    // list is how the office records the exceptions it has decided to serve.
    if (await pincodeAllowed(input.pincode)) {
      return { serviceable: true, via: "pincode", distanceKm: km };
    }
    return { serviceable: false, via: "radius", distanceKm: km };
  }

  // No coordinates: no key, no network, or an address Google could not place.
  if (await pincodeAllowed(input.pincode)) {
    return { serviceable: true, via: "pincode" };
  }
  return { serviceable: false, via: "unknown" };
}

async function pincodeAllowed(pincode: string): Promise<boolean> {
  if (!/^[1-9]\d{5}$/.test(pincode)) return false;
  const { data } = await sbAdmin()
    .from("serviceable_pincodes")
    .select("pincode")
    .eq("pincode", pincode)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(data);
}

/** True when a Maps key exists at all — the UI hides map features without one. */
export function hasMapsKey(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_SERVER_KEY,
  );
}
