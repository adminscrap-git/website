import Image from "next/image";
import { rupees } from "@/lib/format";
import { PHOTO_LABEL } from "@/lib/db-types";
import type { PhotoKind } from "@/lib/db-types";

type Photo = { id: string; kind: PhotoKind; url: string };

/**
 * What came back from the field.
 *
 * Server component: the signed URLs expire, so they are minted per render and
 * never cached. `unoptimized` for the same reason — running a private,
 * short-lived URL through the image optimiser would park a customer's home and
 * their payment behind a public, long-lived CDN path.
 */
export function ProofGallery({
  photos,
  weight,
  amount,
  method,
}: {
  photos: Photo[];
  weight: number | null;
  amount: number | null;
  method: string | null;
}) {
  const settled = weight !== null || amount !== null;

  return (
    <>
      {settled && (
        <dl className="readout mb-4 grid grid-cols-3 gap-3 rounded-[12px] bg-paper-2 p-4">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-3">Weight</dt>
            <dd className="mt-1 text-lg font-bold">{weight ? `${weight} kg` : "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-3">Paid</dt>
            <dd className="mt-1 text-lg font-bold">{amount ? rupees(amount) : "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-3">How</dt>
            <dd className="mt-1 text-lg font-bold">{method ?? "—"}</dd>
          </div>
        </dl>
      )}

      {photos.length === 0 ? (
        <p className="text-sm font-semibold text-ink-2">No photos yet.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <li key={p.id}>
              <a href={p.url} target="_blank" rel="noopener noreferrer">
                <Image
                  src={p.url}
                  alt={PHOTO_LABEL[p.kind]}
                  width={240}
                  height={240}
                  unoptimized
                  className="aspect-square w-full rounded-[12px] object-cover"
                />
              </a>
              <p className="readout mt-1 text-[10px] uppercase tracking-wider text-ink-3">
                {p.kind === "payment_proof" ? "Payment" : "Scrap"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
