import type { Metadata } from "next";
import Link from "next/link";
import { currentAdmin, isSuper } from "@/lib/admin-auth";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · ScrapSquad admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await currentAdmin();

  // The login page renders inside this layout too, before there's an admin.
  // proxy.ts has already bounced anonymous requests to every other route.
  if (!admin) return <div className="flex-1">{children}</div>;

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="border-b-2 border-paper-3 bg-paper-2 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r-2">
        <div className="flex items-center justify-between gap-3 px-5 py-5 lg:block">
          <Link href="/admin" className="display text-2xl">
            ScrapSquad<span className="text-coral">.</span>
            <span className="ml-1.5 align-middle text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
              admin
            </span>
          </Link>
          <form action={signOut} className="lg:hidden">
            <button className="text-sm font-bold text-ink-2 underline underline-offset-4">
              Sign out
            </button>
          </form>
        </div>

        <AdminNav canManage={isSuper(admin)} />

        <div className="hidden px-5 py-6 lg:block">
          <p className="readout text-[10px] uppercase tracking-[0.14em] text-ink-3">
            Signed in
          </p>
          <p className="mt-1 truncate text-sm font-bold">
            {admin.full_name || admin.email}
          </p>
          <p className="readout text-[10px] uppercase tracking-wider text-ink-3">
            {admin.role === "super_admin" ? "Super admin" : "Staff"}
          </p>
          <form action={signOut} className="mt-3">
            <button className="text-sm font-bold text-ink-2 underline underline-offset-4 hover:text-coral-deep">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1 bg-paper px-5 py-8 sm:px-8">{children}</div>
    </div>
  );
}
