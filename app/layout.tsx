import type { Metadata, Viewport } from "next";
import { Gabarito, Martian_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

// Display + UI. Rounded geometric, chunky at 800/900 — carries the toy
// direction without reading as childish.
const gabarito = Gabarito({
  variable: "--font-gabarito",
  subsets: ["latin"],
  display: "swap",
});

// Prices, booking codes, slot times. The `wdth` axis is the whole point —
// wide numerals make a rate feel like a reading off a scale.
const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fdf6ec",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${gabarito.variable} ${martian.variable} h-full`}
    >
      <body className="grain min-h-full bg-paper text-ink flex flex-col">
        {children}
      </body>
    </html>
  );
}
