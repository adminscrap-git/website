"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true, manage: false },
  { href: "/admin/bookings", label: "Bookings", exact: false, manage: false },
  { href: "/admin/agents", label: "Pickup agents", exact: false, manage: true },
  { href: "/admin/catalogue", label: "Catalogue", exact: false, manage: true },
  { href: "/admin/slots", label: "Pickup windows", exact: false, manage: true },
  { href: "/admin/pincodes", label: "Service area", exact: false, manage: true },
  { href: "/admin/settings", label: "Settings", exact: false, manage: true },
] as const;

export function AdminNav({ canManage }: { canManage: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto px-3 pb-3 lg:overflow-visible lg:pb-0">
      <ul className="flex w-max gap-1 lg:w-auto lg:flex-col">
        {LINKS.filter((l) => canManage || !l.manage).map((l) => {
          const active = l.exact
            ? pathname === l.href
            : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={cn(
                  "block whitespace-nowrap rounded-[12px] px-4 py-2.5 text-sm font-extrabold transition-colors",
                  active ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-3 hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
        <li className="lg:mt-4 lg:border-t-2 lg:border-paper-3 lg:pt-4">
          <Link
            href="/"
            className="block whitespace-nowrap rounded-[12px] px-4 py-2.5 text-sm font-bold text-ink-3 hover:text-ink"
          >
            View site ↗
          </Link>
        </li>
      </ul>
    </nav>
  );
}
