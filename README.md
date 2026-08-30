# MINT — Scrap Collection Booking Platform

> Scrap in. Cash out.

Customers browse a catalogue of scrap with published rates, toss what they've got
into a crate, book a free doorstep pickup in a two-hour window, and get a private
link to track, reschedule or cancel it — no signup. Admins manage the catalogue,
pricing, service area, windows and bookings.

Built by Igniks. Next.js 16 · React 19 · Tailwind v4 · Supabase · react-three-fiber.

---

## Getting it running

You need a Supabase project. Everything else is in this repo.

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

<https://supabase.com/dashboard> → New project. Pick the region closest to your
customers (`ap-south-1` for India).

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in from **Project Settings → API**:

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — **server only, never prefix with `NEXT_PUBLIC_`** |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` in dev; your real domain in production |

`NEXT_PUBLIC_SITE_URL` matters more than it looks: it builds the track/cancel link
that goes into every WhatsApp message. Get it wrong in production and customers
get a link to localhost.

### 4. Database

Supabase dashboard → **SQL Editor**. Run these in order:

| File | What it does |
|---|---|
| `supabase/migrations/0001_init.sql` | Tables, constraints, indexes, RLS |
| `supabase/migrations/0002_seed.sql` | Categories, items and Hyderabad rates, pickup windows, pincodes, settings |
| `supabase/migrations/0004_storage.sql` | Public bucket for catalogue photos |

### 5. Your first admin

Signing up grants nothing — admin access needs a row in `admin_profiles`. This is
deliberate: a stray signup or a leaked anon key can't reach the panel.

1. **Authentication → Users → Add user.** Set an email and password, and tick
   **Auto Confirm User** (otherwise the login bounces).
2. Open `supabase/migrations/0003_first_admin.sql`, change the email on the
   marked line, and run it.

### 6. Check the setup

```bash
npm run doctor
```

Walks every step above in order and stops at the first thing that isn't done,
saying exactly what to fix. Read-only — it never writes to your database. Run it
any time something isn't working.

### 7. Go

```bash
npm run dev
```

- Customer site → <http://localhost:3000>
- Admin → <http://localhost:3000/admin>

Then set your real business details in **Admin → Settings** — name, phone,
WhatsApp number, city. The seeded rates are Hyderabad market ranges blended from
public price lists in August 2026 — thekabadiwala.com/scrap-rates/Hyderabad for
what a collector actually pays a household, scraprates.in/hyderabad for the
dealer rate. They exist so the site is never empty. **Replace them with yours.**

The seeded service area is ten verified Hyderabad pincodes. Extend it at
**Admin → Service area** — anyone outside that list can't book.

---

## How it's put together

```
app/
  (site)/          customer site — one route group, one layout
    page.tsx         home: hero diorama, ticker, how it works, categories, impact
    pick/            the shelf — tap items into the crate
    book/            the booking form (works with a full crate or an empty one)
    b/[token]/       track · reschedule · cancel  ← the customer's whole account
    rates/           plain fast rate card (the page that ranks)
    faq/ contact/
  admin/           dashboard, bookings, catalogue, windows, service area, settings
  actions/         all mutations — booking, manage, admin, auth
components/
  three/           the 3D kit: toys, stage, spring motion, palette
  site/ ui/ admin/
lib/               queries, types, formatting, rules, Supabase clients
supabase/migrations/
proxy.ts           session refresh + /admin gate (Next 16 renamed middleware → proxy)
```

### Decisions worth knowing before you change something

**Prices are snapshotted onto bookings.** `booking_items` stores
`name/unit/price_min/price_max` at the moment of booking. Copper moves weekly —
without this, every price edit silently rewrites what past customers were quoted.
Editing a rate never touches history, and deleting an item nulls the reference
rather than cascading.

**The browser is never trusted with money.** The crate stores only item ids and
quantities. `createBooking` re-reads every price from the database by id. A
tampered `localStorage` can change *what* you're booking, never what it's worth.

**The token is the whole customer auth story.** `bookings.token` is 24 random
bytes. Whoever holds it can view, move and cancel. It's never a client-side query
filter — every lookup runs server-side through the service role. `bookings.code`
(`MNT-01234`) is separate, is for phone calls, and is never used to authorise
anything, which is why it can safely be sequential.

**RLS is default-deny.** Only the catalogue tables have policies (public read
while active). `bookings`, `booking_items`, `booking_events`, `waitlist`,
`settings` and `admin_profiles` have RLS on and *zero* policies — they're reached
only through server actions holding the service role. One rule instead of six.

**Roles are checked twice.** `proxy.ts` proves you're signed in. Every admin
action re-checks the role, so a staff account can't POST its way into the rate
card.

**3D is opt-in per device.** The audience is mid-range Android on 4G. `ToyStage`
checks reduced-motion, CPU cores, Data Saver and WebGL support, and falls back to
a flat composition in the same palette — same silhouettes, zero GPU. That
fallback is also what SSR emits, so there's no layout shift.

There are no 3D model files. Every scrap object in `components/three/toys.tsx` is
built from drei primitives — cheaper to ship than a GLB, and restyling the palette
restyles the toys.

**WhatsApp is a link, not an API.** `lib/whatsapp.ts` builds a `wa.me` URL with
the message pre-typed. No Meta approval, no BSP, no monthly fee, works today, and
the customer's tap opens the 24-hour service window. When volume makes that tap
the bottleneck, swap the Cloud API in behind `buildBookingMessage` and every
caller keeps working.

---

## About `@designcodeio/threeui`

Installed as a **devDependency** for reference. It is not, and cannot currently
be, part of the build.

threeui v1.1.0 ships components that call `sRGBEncoding`, removed from three.js in
r152. Some of its files import `three` bare, so they resolve against this
project's three@0.185 and fail to compile:

```
Error: Export sRGBEncoding doesn't exist in target module
  ./node_modules/@designcodeio/threeui/lib-dist/shaders/temple-night/…
```

Downgrading three isn't an option — `@react-three/drei` v10 needs a modern
version. So the source stays on disk as inspiration, which is where its value is
anyway: the shaders and composition techniques are readable at

```
node_modules/@designcodeio/threeui/lib-dist/shaders/
node_modules/@designcodeio/threeui/lib-dist/package-components/
```

To run its live gallery, clone <https://github.com/MengTo/threeui> separately and
`npm install && npm run dev` there — it pins its own three.

---

## Checks

```bash
npm run doctor        # is the local setup complete? (needs Supabase)
npm run check         # self-check: dates, money, cancellation window, WhatsApp
npm run audit:mobile  # horizontal overflow + touch targets (needs `npm run dev`)
npm run build      # typechecks and compiles
npx tsc --noEmit   # types only
npx eslint .       # lint
```

`npm run audit:mobile` drives a headless Chromium over every public page at
320 / 360 / 390 / 414 / 768px — twice, once with an empty crate and once with
four items in it, since the crate dock and header badge are what crowd a small
header. It fails the build if anything scrolls sideways, and warns about touch
targets under 44px. Run it after any layout change; eyeballing a phone in
devtools misses this.

`npm run check` is 18 plain asserts over the logic that fails silently — calendar
dates that shift a day on a non-IST server, estimate arithmetic, phone
normalisation, and the rule that decides whether a customer may still cancel.
No database needed. Run it after touching anything in `lib/`.

## Deploying

Vercel. Add the four environment variables from `.env.local`, set
`NEXT_PUBLIC_SITE_URL` to the real domain, and add that domain to Supabase under
**Authentication → URL Configuration**.

Every page that reads the database is `force-dynamic`, so the build never needs a
reachable database. If traffic makes that cost real, swap the affected pages to
`export const revalidate = 300` — the queries are already shaped for it.
