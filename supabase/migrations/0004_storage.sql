-- ═══════════════════════════════════════════════════════════════════
-- ScrapSquad — 0004_storage
--
-- One public bucket for category and item photos.
--
-- Public read is correct here: these images are already on the public
-- catalogue page, and signed URLs would mean re-signing on every render
-- for no security gain. Writes go through a server action holding the
-- service role, so the bucket needs no anon insert policy.
-- ═══════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalogue',
  'catalogue',
  true,
  3145728,                                    -- 3 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may read; nobody may write with the anon key.
create policy "public reads catalogue images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'catalogue');
