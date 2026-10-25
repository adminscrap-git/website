-- ═══════════════════════════════════════════════════════════════════
-- ScrapSquad — 0007_field_ops
--
-- Pickup agents, job assignment, photo/payment proof, and a message
-- outbox.
-- ═══════════════════════════════════════════════════════════════════

-- ── booking lifecycle ──────────────────────────────────────────────
-- Three new stops between "confirmed" and "picked up". `arrived` exists
-- because a gated community will not let the van in without the resident
-- approving at the gate — that wait is a real state the office needs to see,
-- not a gap in the timeline.
--
-- Postgres cannot add an enum value and use it in the same transaction, so
-- these run first and alone. Values are appended, never reordered: the enum's
-- sort order is its declaration order and existing rows store the position.
alter type booking_status add value if not exists 'assigned'  after 'confirmed';
alter type booking_status add value if not exists 'en_route'  after 'assigned';
alter type booking_status add value if not exists 'arrived'   after 'en_route';

-- An agent acting on a booking is neither the customer nor the office.
alter type actor_kind add value if not exists 'agent';

-- If your client reports "unsafe use of new value of enum type", run the four
-- ALTER TYPE lines above on their own first, then the rest of this file.
-- Nothing below uses the new values, so one pass normally succeeds.

-- ── agents ─────────────────────────────────────────────────────────
-- Deliberately NOT a row in admin_profiles with a new role.
--
-- requireAdmin() grants the whole back office to anyone holding an
-- admin_profiles row. Adding 'agent' to admin_role would make every existing
-- admin check a potential leak of revenue, settings and customer lists to a
-- field phone — one forgotten role argument away. A separate table means an
-- agent cannot be mistaken for an admin by any code path that already exists.
create table if not exists agent_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text not null,
  phone      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_profiles_active_idx on agent_profiles (is_active);

-- ── assignment ─────────────────────────────────────────────────────
-- `on delete set null`: removing an agent must never delete the booking they
-- happened to be carrying.
alter table bookings
  add column if not exists assigned_agent_id uuid references agent_profiles(user_id) on delete set null,
  add column if not exists assigned_at       timestamptz,
  add column if not exists arrived_at        timestamptz,
  add column if not exists gate_approved_at  timestamptz,
  add column if not exists collected_weight  numeric(10,2),
  add column if not exists paid_amount       numeric(10,2),
  add column if not exists payment_method    text;

create index if not exists bookings_agent_idx on bookings (assigned_agent_id, pickup_date desc);

-- ── proof of pickup ────────────────────────────────────────────────
do $$ begin
  create type photo_kind as enum ('scrap', 'payment_proof', 'other');
exception when duplicate_object then null;
end $$;

create table if not exists booking_photos (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  kind         photo_kind not null default 'scrap',
  storage_path text not null,
  caption      text,
  uploaded_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists booking_photos_booking_idx on booking_photos (booking_id, created_at);

-- ── message outbox ─────────────────────────────────────────────────
-- Every message the system decides to send is written here first and sent
-- second. That is what makes "pick a WhatsApp provider later" survivable:
-- the decision to notify, the rendered text, and the delivery attempt are
-- three separate things. With no provider configured, rows simply sit in
-- `queued` and the office can send them by hand from the booking page —
-- which is exactly how the business runs today.
--
-- It also means a provider outage loses nothing, and every message ever sent
-- is auditable against the booking it belongs to.
do $$ begin
  create type notification_channel as enum ('whatsapp', 'sms', 'email');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type notification_status as enum ('queued', 'sent', 'failed', 'skipped');
exception when duplicate_object then null;
end $$;

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references bookings(id) on delete cascade,
  template_key text not null,
  -- 'customer' | 'admin' | 'agent'. Text, not an enum: audiences are a
  -- routing detail that will churn, and a failed insert is worse than a
  -- loose string here.
  audience    text not null,
  channel     notification_channel not null default 'whatsapp',
  recipient   text not null,
  body        text not null,
  payload     jsonb not null default '{}'::jsonb,
  status      notification_status not null default 'queued',
  provider    text,
  provider_id text,
  error       text,
  attempts    int not null default 0,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);

create index if not exists notifications_pending_idx on notifications (status, created_at);
create index if not exists notifications_booking_idx on notifications (booking_id, created_at desc);

-- ── RLS ────────────────────────────────────────────────────────────
-- Same posture as the rest of the schema: deny-all with zero policies, and
-- every read and write goes through the service role in a server action.
-- An agent's phone never talks to Postgres directly.
alter table agent_profiles  enable row level security;
alter table booking_photos  enable row level security;
alter table notifications   enable row level security;

-- ── proof storage ──────────────────────────────────────────────────
-- PRIVATE, unlike the catalogue bucket. These are photographs of a customer's
-- home and of a payment — they are served through short-lived signed URLs to
-- staff only, never by public path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proofs',
  'proofs',
  false,
  8388608,                                    -- 8 MB; phone cameras are big
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No select/insert policy is created on purpose. Uploads and signed URLs are
-- minted server-side with the service role, which bypasses RLS; adding an
-- authenticated policy here would let any signed-in user enumerate the bucket.
