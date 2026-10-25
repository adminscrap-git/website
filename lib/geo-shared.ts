/**
 * Geometry that both sides need.
 *
 * Split out of lib/geo.ts because that file is `server-only` — it holds the
 * API key and talks to Supabase. The booking form needs the same distance
 * maths to warn a customer before they fill in the whole form, and importing
 * the server module into a client component is a build error by design.
 */

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance, accurate well past the precision we need. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
