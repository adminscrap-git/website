-- ═══════════════════════════════════════════════════════════════════
-- ScrapSquad — 0005_hyderabad
--
-- Moves the seeded data from Delhi NCR to Hyderabad, Telangana.
--
-- ONLY NEEDED if you ran the original Delhi version of 0002_seed.sql.
-- 0002 now seeds Hyderabad directly, so a fresh install can skip this —
-- running it anyway is harmless, it just re-applies the same values.
--
-- Safe to run on a database already seeded by 0002. It only touches the
-- rows 0002 created: it removes the twelve Delhi pincodes by name (so
-- anything you added yourself survives), updates item prices by slug, and
-- rewrites the city in settings.
--
-- RATES
-- ─────
-- Blended from two public Hyderabad sources in August 2026:
--   · thekabadiwala.com/scrap-rates/Hyderabad — what a collector actually
--     pays a household, i.e. the floor
--   · scraprates.in/hyderabad — dealer/market rate, i.e. the ceiling
-- The published range sits between the two, which is the honest span once
-- grade and condition are accounted for.
--
-- These are still a starting point. Set your own from /admin/catalogue.
-- ═══════════════════════════════════════════════════════════════════

-- ── service area ───────────────────────────────────────────────────

-- Remove only the Delhi NCR placeholders that 0002 inserted.
delete from serviceable_pincodes
where pincode in (
  '110001','110016','110019','110024','110048','110049',
  '110065','110070','122001','122018','201001','201301'
);

-- Verified Hyderabad pincodes. A deliberately short starter list — a wrong
-- pincode here turns into a real customer being told "we don't collect from
-- your area", so only confirmed ones are seeded. Add the rest of your
-- coverage from /admin/pincodes.
insert into serviceable_pincodes (pincode, area_name) values
  ('500001', 'Afzal Gunj / Hyderabad GPO'),
  ('500016', 'Begumpet / Ameerpet'),
  ('500032', 'Gachibowli / Financial District'),
  ('500033', 'Jubilee Hills'),
  ('500034', 'Banjara Hills'),
  ('500072', 'Kukatpally'),
  ('500081', 'Madhapur / HITEC City / Raidurg'),
  ('500084', 'Kondapur'),
  ('500089', 'Manikonda'),
  ('500090', 'Nizampet / Bachupally')
on conflict (pincode) do update
  set area_name = excluded.area_name,
      is_active = true;

-- ── rates ──────────────────────────────────────────────────────────

update items i
set price_min = v.pmin,
    price_max = v.pmax,
    unit      = v.unit::unit_kind
from (values
  -- metal (per kg)
  ('copper-wire',      450,  650, 'kg'),
  ('mixed-copper',     380,  560, 'kg'),
  ('brass',            280,  430, 'kg'),
  ('aluminium',        100,  160, 'kg'),
  ('stainless-steel',   90,  140, 'kg'),
  ('ms-steel',          28,   40, 'kg'),
  ('iron',              20,   34, 'kg'),
  ('mixed-metal',       15,   25, 'kg'),

  -- paper (per kg)
  ('newspaper',         10,   14, 'kg'),
  ('office-paper',       8,   12, 'kg'),
  ('books',              8,   11, 'kg'),
  ('cardboard',          4,    9, 'kg'),

  -- plastic (per kg)
  ('pet-bottles',       12,   18, 'kg'),
  ('hard-plastic',       8,   14, 'kg'),
  ('soft-plastic',       8,   12, 'kg'),

  -- e-waste
  ('mixed-ewaste',      20,   47, 'kg'),
  ('laptop',           200,  450, 'piece'),
  ('desktop-set',      250,  600, 'set'),
  ('monitor',          100,  250, 'piece'),
  ('printer',          150,  300, 'piece'),
  ('mobile',            50,  250, 'piece'),
  ('ups',              150,  400, 'piece'),
  ('set-top-box',       30,   70, 'piece'),
  ('router',            20,   50, 'piece'),

  -- appliances (per unit; AC spans 1 ton to 2 ton)
  ('ac',              2000, 7000, 'unit'),
  ('refrigerator',     300,  900, 'unit'),
  ('washing-machine',  350,  900, 'unit'),
  ('television',       100,  400, 'unit'),
  ('cooler',           100,  350, 'unit'),
  ('microwave',        100,  300, 'unit'),
  ('geyser',           100,  300, 'unit'),
  ('chimney',          150,  400, 'unit'),
  ('fan',               60,  200, 'piece'),
  ('mixer',             50,  150, 'piece'),

  -- batteries (per kg)
  ('inverter-battery',  70,   90, 'kg'),
  ('ups-battery',       65,   85, 'kg'),

  -- furniture (no published rate anywhere — priced on inspection)
  ('almirah',          400, 1500, 'piece'),
  ('bed',              250, 1200, 'piece'),
  ('sofa',             150,  900, 'piece'),
  ('table',            100,  500, 'piece'),
  ('chair',             50,  250, 'piece'),
  ('mattress',          30,  150, 'piece')
) as v(slug, pmin, pmax, unit)
where i.slug = v.slug;

-- Car batteries are common enough here to be worth their own line.
insert into items (category_id, slug, name, unit, price_min, price_max, note, sort_order)
select c.id, 'car-battery', 'Car / Two-wheeler Battery', 'kg', 60, 75,
       'Lead-acid, any condition.', 3
from categories c
where c.slug = 'batteries'
on conflict (category_id, slug) do nothing;

-- ── business details ───────────────────────────────────────────────

update settings
set value = value || '{"city":"Hyderabad"}'::jsonb
where key = 'business';
