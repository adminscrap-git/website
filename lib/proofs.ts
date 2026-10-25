import "server-only";
import { sbAdmin } from "@/lib/supabase/admin";
import type { BookingPhoto } from "@/lib/db-types";

/**
 * Turns stored paths into viewable URLs.
 *
 * The `proofs` bucket is private, so every view needs a signed URL. They are
 * minted short-lived and per-render rather than stored: these are photographs
 * of a customer's home and of a payment, and a URL that works forever is one
 * forwarded screenshot away from being public.
 */
const TTL_SECONDS = 60 * 30;

export type SignedPhoto = BookingPhoto & { url: string };

export async function signedProofUrls(
  photos: BookingPhoto[],
): Promise<SignedPhoto[]> {
  if (photos.length === 0) return [];

  const { data } = await sbAdmin()
    .storage.from("proofs")
    .createSignedUrls(
      photos.map((p) => p.storage_path),
      TTL_SECONDS,
    );

  const byPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return photos
    .map((p) => ({ ...p, url: byPath.get(p.storage_path) ?? "" }))
    // A missing signature means the object is gone from the bucket. Showing a
    // broken image frame is worse than showing nothing.
    .filter((p) => p.url);
}
