-- ScrapSquad — 0006_slots_45min
--
-- Replaces the five two-hour windows with twelve 45-minute ones, 09:00–18:00.
--
-- The old rows are DEACTIVATED, not deleted. bookings.slot_id is
-- `references time_slots(id) on delete restrict`, so a delete would fail
-- against any booking already taken — and even if it didn't, it would erase
-- the window a past pickup was actually booked into. Deactivating keeps that
-- history readable while hiding the window from the booking form, which
-- filters on is_active.

update time_slots set is_active = false;

insert into time_slots (label, start_time, end_time, capacity, sort_order) values
  ('9:00 - 9:45 AM',   '09:00', '09:45', 5, 1),
  ('9:45 - 10:30 AM',  '09:45', '10:30', 5, 2),
  ('10:30 - 11:15 AM', '10:30', '11:15', 5, 3),
  ('11:15 AM - 12:00 PM', '11:15', '12:00', 5, 4),
  ('12:00 - 12:45 PM', '12:00', '12:45', 5, 5),
  ('12:45 - 1:30 PM',  '12:45', '13:30', 5, 6),
  ('1:30 - 2:15 PM',   '13:30', '14:15', 5, 7),
  ('2:15 - 3:00 PM',   '14:15', '15:00', 5, 8),
  ('3:00 - 3:45 PM',   '15:00', '15:45', 5, 9),
  ('3:45 - 4:30 PM',   '15:45', '16:30', 5, 10),
  ('4:30 - 5:15 PM',   '16:30', '17:15', 5, 11),
  ('5:15 - 6:00 PM',   '17:15', '18:00', 5, 12);
