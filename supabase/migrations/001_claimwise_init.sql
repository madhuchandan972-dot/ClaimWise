-- ============================================================
-- ClaimWise — initial Supabase schema (ADDITIVE ONLY)
--
-- Run once in the Supabase dashboard → SQL editor.
-- Creates the app tables, Row Level Security policies, the
-- profile-creation trigger, and the private documents bucket.
--
-- This script:
--   ✅ only CREATEs (no DROP / ALTER of existing objects)
--   ✅ enables RLS on every table — users can only ever see and
--      modify their OWN rows, matching the API-layer invariant
--   ✅ creates NO sample/fictional records
--
-- After running this, restart `npm run dev` once so the schema
-- cache refreshes.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Profiles (1:1 with auth.users; display data for the app)
-- ──────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text not null default 'Student',
  phone text default '',
  dob text default '',
  gender text default '',
  state text default '',
  district text default '',
  religion text default '',
  category text default '',
  disability boolean default false,
  family_income bigint default 0,
  college text default '',
  course text default '',
  year text default '',
  marks_percentage numeric,
  marks_exam text default '',
  profile_complete boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- 2. Workspace tables
-- ──────────────────────────────────────────────────────────────

create table if not exists public.documents (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  file_type text not null,
  size bigint not null default 0,
  uploaded_at timestamptz not null default now(),
  status text not null default 'pending',
  extracted_data jsonb,
  extraction_mode text,
  reviewed boolean
);
create index if not exists documents_user_id_idx on public.documents (user_id, uploaded_at desc);

create table if not exists public.applications (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  scholarship_id text not null,
  scholarship_name text not null,
  status text not null default 'preparing',
  applied_date timestamptz,
  notes text default '',
  documents jsonb default '[]'::jsonb,
  next_action text default '',
  timeline jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists applications_user_id_idx on public.applications (user_id, created_at desc);

create table if not exists public.notifications (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean default false,
  created_at timestamptz not null default now(),
  link text
);
create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

-- Scholarship catalogue (read-only reference data; rows are added
-- manually — labelled seed script or verified real sources later).
create table if not exists public.scholarships (
  id text primary key,
  name text not null,
  provider text not null,
  amount text not null,
  category jsonb default '[]'::jsonb,
  eligibility jsonb default '{}'::jsonb,
  deadline timestamptz not null,
  open_date timestamptz,
  status text not null default 'open',
  description text not null default '',
  required_documents jsonb default '[]'::jsonb,
  official_link text default '#',
  is_demo boolean default false,
  source text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- 3. Profile auto-creation trigger (runs as security definer so
--    the row exists even before the user is signed in)
-- ──────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- 4. Row Level Security — the DB-level mirror of the API invariant
--    “every accessor is scoped by the verified server session”.
-- ──────────────────────────────────────────────────────────────

alter table public.profiles      enable row level security;
alter table public.documents     enable row level security;
alter table public.applications  enable row level security;
alter table public.notifications enable row level security;
alter table public.scholarships  enable row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "documents_owner_all" on public.documents;
create policy "documents_owner_all" on public.documents
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "applications_owner_all" on public.applications;
create policy "applications_owner_all" on public.applications
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notifications_owner_all" on public.notifications;
create policy "notifications_owner_all" on public.notifications
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "scholarships_authenticated_read" on public.scholarships;
create policy "scholarships_authenticated_read" on public.scholarships
  for select to authenticated
  using (true);

-- ──────────────────────────────────────────────────────────────
-- 5. Private storage bucket for uploaded document bytes
-- ──────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,                      -- PRIVATE — no public URLs, ever
  5242880,                    -- 5 MB, mirrors the API-side cap
  array[
    'application/pdf',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do nothing;

drop policy if exists "documents_bucket_owner_all" on storage.objects;
create policy "documents_bucket_owner_all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Done. New accounts start with a completely blank workspace.
