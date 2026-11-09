-- ============================================================
-- ClaimWise— Migration 006: Official record references (RD lookup)
--
-- Stores the user's saved lookups for government documents found
-- by RD/registration number. Rows hold ONLY a reference:
--   • which registry entry was used (state + kind)
--   • the details the user plans to enter (doc number, year…)
--
-- No files, no scraped content and no stored government data —
-- users always download the actual document from the official
-- portal linked in the reference.
-- Run in Supabase → SQL editor, then restart the dev server.
-- ============================================================

create table if not exists public.record_references (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  state_code text not null,
  entry_id text not null,
  values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists record_references_user_id_idx
  on public.record_references (user_id, created_at desc);

alter table public.record_references enable row level security;

drop policy if exists "record_references_owner_all" on public.record_references;
create policy "record_references_owner_all"
  on public.record_references
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
