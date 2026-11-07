-- ============================================================
-- ClaimWise — storage bucket visibility fix (ADDITIVE ONLY)
--
-- Run once in the Supabase dashboard → SQL editor.
--
-- Why: verify-integrations.mjs probes GET /storage/v1/bucket with
-- the anon key. storage.buckets has RLS enabled (Supabase-managed,
-- do NOT touch the table itself), and migration 001 added policies
-- only on storage.objects — so the anon role sees NO buckets and
-- the probe reports "not found" even though 'documents' exists.
--
-- This script adds a *metadata read* policy scoped to ONLY the
-- 'documents' bucket. It exposes nothing else: just id/name/
-- public/file-size/mime metadata of that one bucket. No table is
-- created, altered, or dropped; no bucket data is touched.
-- ============================================================

drop policy if exists "documents_bucket_metadata_readable" on storage.buckets;
create policy "documents_bucket_metadata_readable" on storage.buckets
  for select to anon, authenticated
  using (id = 'documents');

-- Done. The verify script's bucket probe will now find 'documents'.
