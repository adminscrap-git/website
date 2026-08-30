-- ═══════════════════════════════════════════════════════════════════
-- MINT — 0003_first_admin
--
-- Admin access is NOT granted by signing up. It requires a row in
-- admin_profiles, created by hand. This is deliberate: it means a stray
-- signup, or a leaked anon key, cannot reach the admin panel.
--
-- TO CREATE THE FIRST ADMIN
-- ─────────────────────────
-- 1. Supabase dashboard → Authentication → Users → "Add user"
--      · Email:    you@yourcompany.com
--      · Password: something long
--      · Tick "Auto Confirm User" (otherwise the login will bounce)
--
-- 2. Run the statement below with that email. It looks the user up in
--    auth.users, so you never have to copy a UUID around.
-- ═══════════════════════════════════════════════════════════════════

insert into admin_profiles (user_id, email, full_name, role)
select id, email, 'Owner', 'super_admin'
from auth.users
where email = 'you@yourcompany.com'   -- ← change this
on conflict (user_id) do update
  set role = excluded.role,
      email = excluded.email;

-- ── adding staff later ─────────────────────────────────────────────
-- Same flow, with role 'staff'. Staff can work bookings; they cannot
-- touch pricing, service area or settings.
--
--   insert into admin_profiles (user_id, email, full_name, role)
--   select id, email, 'Ramesh', 'staff'
--   from auth.users where email = 'ramesh@yourcompany.com'
--   on conflict (user_id) do update set role = excluded.role;

-- ── revoking access ────────────────────────────────────────────────
-- Deleting the profile row removes admin access immediately while leaving
-- the auth user intact. Delete the auth user too if they've left.
--
--   delete from admin_profiles
--   where user_id = (select id from auth.users where email = 'someone@yourcompany.com');
