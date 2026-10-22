-- ═══════════════════════════════════════════════════════════════════
-- MINT — 0002_seed
--
-- Starting catalogue for Hyderabad, Telangana.
--
-- Rates blended from two public Hyderabad sources in August 2026:
--   · thekabadiwala.com/scrap-rates/Hyderabad — what a collector actually
--     pays a household, i.e. the floor
--   · scraprates.in/hyderabad — dealer/market rate, i.e. the ceiling
-- The published range sits between the two, which is the honest span once
-- grade and condition are accounted for.
--
-- EVERY value here is editable from /admin. It exists so the site is never
-- empty, not as a commitment. Set your own before you take real bookings.
-- ═══════════════════════════════════════════════════════════════════

-- ── categories ─────────────────────────────────────────────────────
insert into categories (slug, name, description, sort_order) values
  ('e-waste',    'E-Waste',    'Laptops, phones, monitors, cables and anything with a circuit board.', 1),
  ('appliances', 'Appliances', 'The big stuff. ACs, fridges, washing machines — we carry it down ourselves.', 2),
  ('metal',      'Metal',      'Iron, steel, copper, brass, aluminium. Weighed on a certified scale.', 3),
  ('paper',      'Paper',      'Newspaper, books, cartons, office paper. The classic raddi.', 4),
  ('plastic',    'Plastic',    'Bottles, containers, hard and film plastic.', 5),
  ('batteries',  'Batteries',  'Inverter, car and UPS batteries. Handled and disposed of properly.', 6),
  ('furniture',  'Furniture',  'Sofas, beds, almirahs, mattresses. Priced on inspection.', 7);

-- ── items ──────────────────────────────────────────────────────────
insert into items (category_id, slug, name, unit, price_min, price_max, note, sort_order)
select c.id, v.slug, v.name, v.unit::unit_kind, v.pmin, v.pmax, v.note, v.ord
from (values
  -- e-waste
  ('e-waste','laptop',          'Laptop',              'piece',  200,  450, 'Working or dead, both fine.',                1),
  ('e-waste','desktop-set',     'Desktop Computer Set','set',    250,  600, 'CPU, monitor and keyboard together.',        2),
  ('e-waste','monitor',         'Monitor / Display',   'piece',  100,  250, 'CRT, LCD or LED.',                           3),
  ('e-waste','mobile',          'Mobile Phone',        'piece',   50,  250, 'We wipe storage before recycling.',          4),
  ('e-waste','printer',         'Printer / Scanner',   'piece',  150,  300, null,                                         5),
  ('e-waste','ups',             'UPS / Inverter Unit', 'piece',  150,  400, 'More with the battery still in it.',         6),
  ('e-waste','set-top-box',     'Set-Top Box',         'piece',   30,   70, null,                                         7),
  ('e-waste','router',          'Router / Modem',      'piece',   20,   50, null,                                         8),
  ('e-waste','mixed-ewaste',    'Mixed E-Waste',       'kg',      20,   47, 'Cables, boards, chargers, odds and ends.',   9),

  -- appliances
  ('appliances','ac',              'Air Conditioner',      'unit', 2000, 7000, 'Window or split. 1 ton to 2 ton, depending on the copper coil.', 1),
  ('appliances','refrigerator',    'Refrigerator',         'unit',  300,  900, 'Single or double door.',                    2),
  ('appliances','washing-machine', 'Washing Machine',      'unit',  350,  900, 'Semi or fully automatic.',                  3),
  ('appliances','television',      'Television',           'unit',  100,  400, 'CRT, LCD or LED.',                          4),
  ('appliances','cooler',          'Air Cooler',           'unit',  100,  350, 'Plastic or tin body.',                      5),
  ('appliances','microwave',       'Microwave Oven',       'unit',  100,  300, null,                                        6),
  ('appliances','geyser',          'Water Geyser',         'unit',  100,  300, null,                                        7),
  ('appliances','chimney',         'Kitchen Chimney',      'unit',  150,  400, null,                                        8),
  ('appliances','fan',             'Ceiling / Exhaust Fan','piece',  60,  200, null,                                        9),
  ('appliances','mixer',           'Mixer / Grinder',      'piece',  50,  150, null,                                       10),

  -- metal
  ('metal','copper-wire',     'Copper Bright Wire',  'kg', 450, 650, 'Stripped, clean wire.',            1),
  ('metal','mixed-copper',    'Mixed Copper',        'kg', 380, 560, 'Coils, utensils, mixed grade.',    2),
  ('metal','brass',           'Brass',               'kg', 280, 430, null,                               3),
  ('metal','aluminium',       'Aluminium',           'kg', 100, 160, 'Utensils, sections, sheets.',      4),
  ('metal','stainless-steel', 'Stainless Steel',     'kg',  90, 140, null,                               5),
  ('metal','ms-steel',        'MS / Mild Steel',     'kg',  28,  40, null,                               6),
  ('metal','iron',            'Iron / Loha',         'kg',  20,  34, 'Grills, rods, gates, frames.',     7),
  ('metal','mixed-metal',     'Mixed Metal / Tin',   'kg',  15,  25, null,                               8),

  -- paper
  ('paper','newspaper',    'Newspaper / Raddi',    'kg', 10, 14, null,                          1),
  ('paper','office-paper', 'Office / Copier Paper','kg',  8, 12, 'White paper pays the most.',  2),
  ('paper','books',        'Books & Mixed Paper',  'kg',  8, 11, 'Magazines, notebooks, files.', 3),
  ('paper','cardboard',    'Cardboard / Carton',   'kg',  4,  9, 'Flattened, please.',           4),

  -- plastic
  ('plastic','pet-bottles',  'PET Bottles',         'kg', 12, 18, 'Water and cold-drink bottles.', 1),
  ('plastic','hard-plastic', 'Hard Plastic',        'kg',  8, 14, 'Buckets, crates, chairs.',      2),
  ('plastic','soft-plastic', 'Soft / Film Plastic', 'kg',  8, 12, 'Bags, wrap, packaging film.',   3),

  -- batteries
  ('batteries','inverter-battery','Inverter Battery',            'kg', 70, 90, 'Lead-acid, any condition.', 1),
  ('batteries','ups-battery',     'UPS Battery',                 'kg', 65, 85, null,                        2),
  ('batteries','car-battery',     'Car / Two-wheeler Battery',   'kg', 60, 75, 'Lead-acid, any condition.', 3),

  -- furniture
  ('furniture','almirah',  'Steel Almirah',   'piece', 400, 1500, null,                        1),
  ('furniture','bed',      'Bed / Diwan',     'piece', 250, 1200, 'Wooden or steel frame.',    2),
  ('furniture','sofa',     'Sofa',            'piece', 150,  900, 'Priced on condition.',      3),
  ('furniture','table',    'Table / Desk',    'piece', 100,  500, null,                        4),
  ('furniture','chair',    'Chair',           'piece',  50,  250, null,                        5),
  ('furniture','mattress', 'Mattress',        'piece',  30,  150, null,                        6)
) as v(cat, slug, name, unit, pmin, pmax, note, ord)
join categories c on c.slug = v.cat;

-- ── pickup windows ─────────────────────────────────────────────────
insert into time_slots (label, start_time, end_time, capacity, sort_order) values
  ('Morning',        '09:00', '11:00', 8, 1),
  ('Late morning',   '11:00', '13:00', 8, 2),
  ('Afternoon',      '13:00', '15:00', 8, 3),
  ('Late afternoon', '15:00', '17:00', 8, 4),
  ('Evening',        '17:00', '19:00', 6, 5);

-- ── service area ───────────────────────────────────────────────────
-- Verified Hyderabad pincodes only. A deliberately short starter list — a
-- wrong pincode here turns into a real customer being told "we don't collect
-- from your area". Add the rest of your coverage from /admin/pincodes.
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
  ('500090', 'Nizampet / Bachupally');

-- ── settings ───────────────────────────────────────────────────────
insert into settings (key, value) values
  ('business',  '{"name":"MINT","tagline":"Scrap in. Cash out.","city":"Hyderabad","phone":"+91 95153 21371","whatsapp":"919515321371","email":"hello@mint.example","address":"","maps_url":""}'),
  ('booking',   '{"min_pickup_value":300,"cancel_cutoff_hours":2,"max_days_ahead":14,"show_estimate":true}'),
  ('wa_confirm','"Hi MINT — confirming my scrap pickup.\n\nBooking: {{code}}\nWhen: {{date}}, {{slot}}\nItems: {{items}}\nAddress: {{address}}\n{{maps}}\n\nTrack or cancel: {{track}}"'),
  ('wa_status', '"Hi {{name}}, this is MINT about pickup {{code}} on {{date}} ({{slot}}).\n\nStatus: {{status}}\n\nTrack or cancel: {{track}}"'),
  -- Conservative published recycling figures. Shown as estimates, never as
  -- audited numbers. Editable so the client can align them with whatever
  -- their recycler actually certifies.
  ('impact',    '{"trees_per_kg_paper":0.017,"litres_water_per_kg_paper":30,"kwh_per_kg_metal":9,"kg_co2_per_kg_ewaste":1.4}');
