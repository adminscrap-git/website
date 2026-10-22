import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-5 py-20">
      <div className="max-w-lg text-center">
        <p className="display text-[clamp(5rem,20vw,11rem)] leading-none text-cobalt">
          404
        </p>
        <h1 className="display mt-4 text-3xl sm:text-4xl">
          Nothing here worth collecting.
        </h1>
        <p className="mt-4 text-lg font-semibold text-ink-2">
          The page is gone, or the link was wrong. If you were opening a booking
          link, check it copied in full — they&apos;re long on purpose.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-coral px-7 py-3.5 text-lg font-extrabold text-ink border-b-[5px] border-coral-deep active:translate-y-[5px] active:border-b-0"
          >
            Back home
          </Link>
          <Link
            href="/rates"
            className="rounded-full border-2 border-ink border-b-[5px] bg-paper px-7 py-3.5 text-lg font-extrabold active:translate-y-[5px] active:border-b-0"
          >
            Browse the rate card
          </Link>
        </div>
      </div>
    </div>
  );
}
