-- ═══════════════════════════════════════════════════════════════════
-- ScrapSquad — 0009_category_order
--
-- The rate card and the booking flow both read categories in sort_order, so
-- this one column decides what someone meets first. Reordered to run from the
-- everyday stuff people actually have stacked in a corner — raddi, bottles —
-- down to the rare one-offs. E-waste and appliances led before, which put the
-- two categories a household clears out once every few years at the top of a
-- page most people open with a bundle of newspaper in mind.
--
-- Matched by name rather than id: ids are generated per environment.
-- ═══════════════════════════════════════════════════════════════════

update categories set sort_order = v.sort_order
from (values
  ('Paper',      1),
  ('Plastic',    2),
  ('Metal',      3),
  ('Appliances', 4),
  ('E-Waste',    5),
  ('Furniture',  6),
  ('Batteries',  7)
) as v(name, sort_order)
where categories.name = v.name;
