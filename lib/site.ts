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
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "919999999999",
  phone: process.env.NEXT_PUBLIC_PHONE ?? "+91 99999 99999",
  email: process.env.NEXT_PUBLIC_EMAIL ?? "hello@mint.example",
  city: process.env.NEXT_PUBLIC_CITY ?? "Hyderabad",

  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const telHref = `tel:${site.phone.replace(/[^\d+]/g, "")}`;

/** Every promise we make on the site, in one place so they stay identical. */
export const promises = [
  { label: "Free doorstep pickup", detail: "We come to you. No charge, ever." },
  { label: "Digital weighing", detail: "Certified scale, weighed in front of you." },
  { label: "Instant cash or UPI", detail: "Paid the moment we lift it off your floor." },
] as const;
