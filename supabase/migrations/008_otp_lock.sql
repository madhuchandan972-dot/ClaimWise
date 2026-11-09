-- ============================================================
-- ClaimWise — Migration 008: OTP sensitive-action lock
--
-- Short-lived one-time codes verify the OWNER's mobile number
-- before sensitive vault actions (e.g. opening stored document
-- bytes). Rows hold only a SHA-256 hash of the code plus a
-- random salt — never the code itself.
--
-- The table is owner-scoped by RLS: only the requesting user
-- (or the server API) can see or consume their own challenges.
-- Run in Supabase → SQL editor, then restart the dev server.
-- ============================================================

create table if not exists public.otp_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  purpose text not null default 'vault-file',
  salt text not null,
  code_hash text not null,
  attempts int not null default 0,
  consumed boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists otp_challenges_user_idx
  on public.otp_challenges (user_id, purpose, created_at desc);

alter table public.otp_challenges enable row level security;

drop policy if exists "otp_challenges_owner_all" on public.otp_challenges;
create policy "otp_challenges_owner_all"
  on public.otp_challenges
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
