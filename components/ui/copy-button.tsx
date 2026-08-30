"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function CopyButton({
  text,
  label = "Copy details",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      className={cn(
        "rounded-full border-2 border-ink px-5 py-2.5 text-base font-extrabold transition-colors",
        done ? "bg-ink text-paper" : "bg-transparent hover:bg-paper-2",
        className,
      )}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Insecure context or a browser that refuses — fall back to a prompt
          // so the text is still reachable rather than silently doing nothing.
          window.prompt("Copy this:", text);
          return;
        }
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}
