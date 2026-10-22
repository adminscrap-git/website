import { CrateProvider } from "@/lib/crate";
import { getSettings } from "@/lib/queries";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SideRail } from "@/components/site/side-rail";
import { BottomBar } from "@/components/site/bottom-bar";

/**
 * Reads settings so the footer and the action rail show the number the admin
 * panel actually set. They used to read the build-time environment fallback,
 * which meant a stale Vercel variable put the wrong number on every page while
 * the database held the right one.
 *
 * `getSettings` is `cache()`d per render and every page already calls it, so
 * this costs no extra query.
 */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { business } = await getSettings();

  return (
    <CrateProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer business={business} />
      {/* The bar is fixed, so the footer needs room to clear it — otherwise the
          last row of footer links sits underneath. */}
      <div className="h-[var(--bottombar-h)]" aria-hidden />
      <SideRail whatsapp={business.whatsapp} phone={business.phone} />
      <BottomBar />
    </CrateProvider>
  );
}
