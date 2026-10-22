"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { telHref } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * The floating action rail — WhatsApp, dialer, share, back to top.
 *
 * Sits above the bottom bar on a phone (`--bottombar-h`), and clear of the
 * footer's bottom edge on desktop. The back-to-top button is the only one that
 * comes and goes: showing it at scroll 0 points at where you already are.
 */

const SCROLL_REVEAL = 400;

/** `whatsapp` and `phone` come from the `settings` table via the layout — the
 * rail is on every page, so reading the build-time fallback here put a stale
 * number site-wide. */
export function SideRail({ whatsapp, phone }: { whatsapp: string; phone: string }) {
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < SCROLL_REVEAL);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed right-4 z-40 flex flex-col items-center gap-3 sm:right-6",
        // The bar is on screen at every width now, so the rail always sits above it.
        "bottom-[calc(var(--bottombar-h)+1rem)]",
      )}
    >
      <Fab
        label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "bg-cobalt-deep",
          // Collapses rather than just fading, so the stack closes up behind it.
          atTop && "pointer-events-none scale-50 opacity-0",
        )}
      >
        <ArrowUp />
      </Fab>

      <ShareFab />

      <Fab
        label="Chat with us on WhatsApp"
        href={`https://wa.me/${whatsapp}`}
        external
        className="bg-coral"
      >
        <WhatsApp />
      </Fab>

      <Fab label={`Call ${phone}`} href={telHref(phone)} className="bg-coral-deep">
        <Phone />
      </Fab>
    </div>
  );
}

/* ── the cap ───────────────────────────────────────────────────── */

type FabProps = {
  label: string;
  className?: string;
  children: React.ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
};

const CAP = cn(
  "grid h-12 w-12 place-items-center rounded-full text-paper shadow-lg shadow-ink/15",
  "transition-[transform,opacity,background-color] duration-200 ease-[var(--ease-out-toy)]",
  "hover:scale-110 active:scale-95",
);

function Fab({ label, className, children, href, external, onClick }: FabProps) {
  if (href) {
    return (
      <a
        href={href}
        aria-label={label}
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
        className={cn(CAP, className)}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} className={cn(CAP, className)}>
      {children}
    </button>
  );
}

/**
 * Web Share where it exists (every mobile browser that matters), clipboard
 * everywhere else. A cancelled share sheet rejects with AbortError — that's a
 * user decision, not a failure, so it must not fall through to the clipboard.
 *
 * The desktop path needs its own feedback: the share sheet is its own
 * confirmation, a silent clipboard write looks like a dead button.
 */
function ShareFab() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const onShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: site.name, text: site.tagline, url });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        // Anything else — share unsupported for this payload — falls through.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setToast("Link copied");
    } catch {
      setToast("Couldn't copy");
    }
  };

  return (
    <div className="relative">
      <Fab label="Share this page" onClick={onShare} className="bg-cobalt">
        <Share />
      </Fab>
      {toast && (
        <span
          role="status"
          className="readout pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-paper"
        >
          {toast}
        </span>
      )}
    </div>
  );
}

/* ── glyphs ────────────────────────────────────────────────────── */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function ArrowUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden {...STROKE}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function Share() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden {...STROKE}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function WhatsApp() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24Zm-2.6 4.1c-.17 0-.45.07-.69.33-.24.26-.9.88-.9 2.15 0 1.27.92 2.49 1.05 2.66.13.17 1.8 2.76 4.37 3.86.61.26 1.09.42 1.46.54.61.2 1.17.17 1.61.1.49-.07 1.51-.62 1.73-1.21.21-.6.21-1.1.15-1.21-.06-.1-.24-.17-.5-.3-.26-.13-1.52-.75-1.76-.84-.23-.08-.4-.13-.58.14-.17.26-.66.83-.81 1-.15.18-.3.2-.56.07-.26-.13-1.09-.4-2.08-1.28a7.8 7.8 0 0 1-1.44-1.79c-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.46.13-.15.17-.26.26-.43.09-.18.04-.33-.02-.46-.07-.13-.58-1.4-.8-1.92-.2-.5-.4-.44-.55-.44l-.47-.01Z" />
    </svg>
  );
}

function Phone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden {...STROKE}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}
