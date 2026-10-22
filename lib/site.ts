import { normalisePhone } from "@/lib/format";

/**
 * Static brand + contact facts.
 *
 * Anything the client should be able to change without a deploy lives in the
 * Supabase `settings` table instead (see lib/settings.ts). What's here is the
 * stuff needed at build time — metadata, JSON-LD, the footer — plus safe
 * fallbacks for when the DB is unreachable.
 */
export const site = {
  name: "MINT",
  tagline: "Scrap in. Cash out.",
  description:
    "Book a free doorstep scrap pickup. Transparent rates, digital weighing, instant cash or UPI. E-waste, metal, paper, plastic, appliances and furniture.",

  // Digits only, with country code — this is what wa.me needs.
  whatsapp: normalisePhone(process.env.NEXT_PUBLIC_WHATSAPP || "919515321371"),
  phone: process.env.NEXT_PUBLIC_PHONE ?? "+91 95153 21371",
  email: process.env.NEXT_PUBLIC_EMAIL ?? "hello@mint.example",
  city: process.env.NEXT_PUBLIC_CITY ?? "Hyderabad",

  url: resolveSiteUrl(),
} as const;

/**
 * The site's own address, which is load-bearing: it builds the track/cancel
 * link that goes into every WhatsApp confirmation. Get it wrong in production
 * and customers receive a link to localhost.
 *
 * Order matters. NEXT_PUBLIC_SITE_URL wins so a custom domain always overrides.
 * Failing that, Vercel's own production URL — always set, at build and runtime,
 * and stable across deployments (unlike VERCEL_URL, which changes every push).
 * That means the very first deploy is correct without anyone setting anything.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  // The NEXT_PUBLIC_ variant is what survives into a client bundle; the bare
  // one is what server code sees. Check both rather than guess which we're in.
  const vercel =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const telHref = `tel:${site.phone.replace(/[^\d+]/g, "")}`;

/** Every promise we make on the site, in one place so they stay identical. */
export const promises = [
  { label: "Free doorstep pickup", detail: "We come to you. No charge, ever." },
  { label: "Digital weighing", detail: "Certified scale, weighed in front of you." },
  { label: "Instant cash or UPI", detail: "Paid the moment we lift it off your floor." },
] as const;
