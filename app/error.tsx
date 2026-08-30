"use client";

import { useEffect } from "react";
import { site } from "@/lib/site";

/**
 * The most likely cause in a fresh install is a missing or wrong Supabase
 * env var, so say that plainly rather than showing a generic apology.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const looksLikeSetup = /supabase|missing|fetch failed|NEXT_PUBLIC/i.test(
    error.message,
  );

  return (
    <div className="grid min-h-[70vh] place-items-center px-5 py-20">
      <div className="max-w-xl">
        <p className="readout text-[11px] uppercase tracking-[0.18em] text-coral-deep">
          Something broke
        </p>
        <h1 className="display mt-4 text-[clamp(2.4rem,8vw,4rem)]">
          That didn&apos;t load.
        </h1>

        {looksLikeSetup ? (
          <div className="mt-6 rounded-toy bg-sun-soft p-6">
            <p className="text-lg font-bold">This looks like a setup problem.</p>
            <ol className="mt-3 space-y-1.5 text-base font-semibold text-ink-2">
              <li>
                1. Copy <code className="font-mono">.env.example</code> to{" "}
                <code className="font-mono">.env.local</code>
              </li>
              <li>2. Fill in your Supabase URL, anon key and service role key</li>
              <li>
                3. Run the SQL in{" "}
                <code className="font-mono">supabase/migrations/</code> in order
              </li>
              <li>4. Restart the dev server</li>
            </ol>
          </div>
        ) : (
          <p className="mt-5 text-lg font-semibold text-ink-2">
            Try again in a moment. If it keeps happening, message us and
            we&apos;ll sort your booking out by hand.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-coral px-7 py-3.5 text-lg font-extrabold text-ink border-b-[5px] border-coral-deep active:translate-y-[5px] active:border-b-0"
          >
            Try again
          </button>
          <a
            href={`https://wa.me/${site.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border-2 border-ink border-b-[5px] bg-paper px-7 py-3.5 text-lg font-extrabold active:translate-y-[5px] active:border-b-0"
          >
            Message us
          </a>
        </div>

        {error.digest && (
          <p className="readout mt-8 text-xs text-ink-3">Ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
