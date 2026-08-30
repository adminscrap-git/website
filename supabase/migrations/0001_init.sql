-- ═══════════════════════════════════════════════════════════════════
-- MINT — scrap collection booking platform
-- 0001_init : schema, constraints, RLS
--
-- Paste into the Supabase SQL editor, or run with `supabase db push`.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

-- ── enums ──────────────────────────────────────────────────────────
create type unit_kind      as enum ('kg', 'piece', 'unit', 'set');
create type booking_status as enum ('pending', 'confirmed', 'picked_up', 'completed', 'cancelled');
create type actor_kind     as enum ('customer', 'admin', 'system');
create type admin_role     as enum ('super_admin', 'staff');

-- ── catalogue ──────────────────────────────────────────────────────
create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  photo_url   text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table items (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  slug        text not null,
  name        text not null,
  note        text,
  photo_url   text,
  unit        unit_kind not null default 'kg',
  -- price_min = price_max renders as a single fixed price in the UI.
  -- That is how "range or fixed" stays one schema instead of two.
  price_min   numeric(10,2) not null default 0,
  price_max   numeric(10,2) not null default 0,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (category_id, slug),
  constraint items_price_range check (price_min >= 0 and price_max >= price_min)
);

create index items_category_idx on items (category_id, sort_order);

-- ── operations ─────────────────────────────────────────────────────
create table time_slots (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  start_time time not null,
  end_time   time not null,
  capacity   int  not null default 10 check (capacity > 0),
  sort_order int  not null default 0,
  is_active  boolean not null default true,
  constraint slot_window check (end_time > start_time)
);

create table serviceable_pincodes (
  id         uuid primary key default gen_random_uuid(),
  pincode    text not null unique check (pincode ~ '^[1-9][0-9]{5}$'),
  area_name  text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Where people wanted us and we were not. This list is the expansion roadmap.
create table waitlist (
  id         uuid primary key default gen_random_uuid(),
  pincode    text not null,
  phone      text not null,
  name       text,
  created_at timestamptz not null default now()
);

-- ── bookings ───────────────────────────────────────────────────────

-- Human-readable reference for phone calls. Sequential is fine and
-- deliberate: `code` is never used for authorisation — `token` is.
-- Starting at 1001 so the first booking does not read as MNT-00001.
create sequence booking_code_seq start 1001;

create table bookings (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique
                default 'MNT-' || lpad(nextval('booking_code_seq')::text, 5, '0'),

  -- 48 hex chars. This is the entire customer auth story: whoever holds it
  -- can view, reschedule and cancel. Never logged, never in a query string.
  token         text not null unique
                default encode(extensions.gen_random_bytes(24), 'hex'),

  name          text not null,
  phone         text not null,
  email         text,

  address_line  text not null,
  landmark      text,
  pincode       text not null,
  maps_url      text,

  pickup_date   date not null,
  slot_id       uuid not null references time_slots(id) on delete restrict,

  status        booking_status not null default 'pending',

  -- Set when the customer books straight from the form without browsing the
  -- catalogue. Informative alongside booking_items, not exclusive to it:
  -- a booking may carry both a crate and a free-text note.
  free_text_items text,

  estimate_min  numeric(10,2) not null default 0,
  estimate_max  numeric(10,2) not null default 0,

  customer_notes text,
  admin_notes    text,

  cancelled_at   timestamptz,
  cancelled_by   actor_kind,
  cancel_reason  text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index bookings_status_idx  on bookings (status);
create index bookings_date_idx    on bookings (pickup_date desc);
create index bookings_created_idx on bookings (created_at desc);
create index bookings_phone_idx   on bookings (phone);
create index bookings_pincode_idx on bookings (pincode);

-- Powers the slot-capacity count run on every booking attempt.
create index bookings_slot_load_idx on bookings (pickup_date, slot_id)
  where status <> 'cancelled';

create table booking_items (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,

  -- Kept for reporting only. Nulled rather than cascaded when the admin
  -- deletes an item, because the snapshot below is the source of truth.
  item_id    uuid references items(id) on delete set null,

  -- Copper moves weekly. Without these columns every price edit silently
  -- rewrites what past customers were quoted.
  name_snapshot          text not null,
  category_name_snapshot text,
  unit_snapshot          unit_kind not null,
  price_min_snapshot     numeric(10,2) not null,
  price_max_snapshot     numeric(10,2) not null,

  qty        numeric(10,2) not null default 1 check (qty > 0)
);

create index booking_items_booking_idx on booking_items (booking_id);

-- Every status transition. Doubles as the dashboard activity feed, so there
-- is no separate feed table.
create table booking_events (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  from_status booking_status,
  to_status   booking_status not null,
  actor       actor_kind not null default 'system',
  note        text,
  created_at  timestamptz not null default now()
);

create index booking_events_recent_idx  on booking_events (created_at desc);
create index booking_events_booking_idx on booking_events (booking_id, created_at);

-- ── admin ──────────────────────────────────────────────────────────
create table admin_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       admin_role not null default 'staff',
  created_at timestamptz not null default now()
);

create table settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── updated_at ─────────────────────────────────────────────────────
create or replace function touch_updated_at() returns trigger
language plpgsql as $fn$
begin
  new.updated_at := now();
  return new;
end
$fn$;

create trigger bookings_touch before update on bookings
  for each row execute function touch_updated_at();

create trigger settings_touch before update on settings
  for each row execute function touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- RLS
--
-- Catalogue tables are publicly readable while active — that is the whole
-- anon surface. Everything else is default-deny with zero policies and is
-- reached only through Next.js server actions using the service role.
-- One rule to reason about instead of six.
-- ═══════════════════════════════════════════════════════════════════

alter table categories           enable row level security;
alter table items                enable row level security;
alter table time_slots           enable row level security;
alter table serviceable_pincodes enable row level security;
alter table bookings             enable row level security;
alter table booking_items        enable row level security;
alter table booking_events       enable row level security;
alter table waitlist             enable row level security;
alter table admin_profiles       enable row level security;
alter table settings             enable row level security;

create policy "public reads active categories" on categories
  for select to anon, authenticated using (is_active);

create policy "public reads active items" on items
  for select to anon, authenticated using (
    is_active and exists (
      select 1 from categories c
      where c.id = items.category_id and c.is_active
    )
  );

create policy "public reads active slots" on time_slots
  for select to anon, authenticated using (is_active);

create policy "public reads active pincodes" on serviceable_pincodes
  for select to anon, authenticated using (is_active);

-- bookings, booking_items, booking_events, waitlist, admin_profiles and
-- settings intentionally have NO policies. RLS on + no policy = deny all.
