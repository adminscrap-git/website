-- ═══════════════════════════════════════════════════════════════════
-- ScrapSquad — 0008_booking_code_prefix
--
-- The booking code still read MNT-01005, from before the rebrand. It is
-- printed on the customer's booking page, read out on the phone, and quoted
-- in every WhatsApp message — the last place the old name was still showing.
--
-- Only the DEFAULT changes. Codes already issued stay exactly as they are:
-- a customer holding MNT-01004 must still be findable by it, and the sequence
-- carries on from where it was, so no two bookings can ever collide.
-- ═══════════════════════════════════════════════════════════════════

alter table bookings
  alter column code
  set default 'SQD-' || lpad(nextval('booking_code_seq')::text, 5, '0');
