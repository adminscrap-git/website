import { CrateProvider } from "@/lib/crate";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SideRail } from "@/components/site/side-rail";
import { BottomBar } from "@/components/site/bottom-bar";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <CrateProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* The bar is fixed, so the footer needs room to clear it — otherwise the
          last row of footer links sits underneath. */}
      <div className="h-[var(--bottombar-h)]" aria-hidden />
      <SideRail />
      <BottomBar />
    </CrateProvider>
  );
}
