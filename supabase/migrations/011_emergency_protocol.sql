-- ============================================================
-- ClaimWise — Migration 011: Emergency Protocols (ICE & Nominee Handover)
--
-- Stores paramedic medical vitals (blood group, allergies, chronic
-- conditions, medications) and confidential family nominee handover
-- instructions (physical locker locations, will/deed keys, steps).
--
-- RLS-protected: only the vault owner can read and update.
-- ============================================================

create table if not exists public.emergency_protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  blood_group text not null default '',
  allergies text not null default '',
  chronic_conditions text not null default '',
  medications text not null default '',
  preferred_hospital text not null default '',
  nominee_name text not null default '',
  nominee_relationship text not null default '',
  nominee_phone text not null default '',
  nominee_email text not null default '',
  locker_locations text not null default '',
  will_deed_locations text not null default '',
  handover_instructions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.emergency_protocols enable row level security;

drop policy if exists "emergency_protocols_owner_all" on public.emergency_protocols;
create policy "emergency_protocols_owner_all"
  on public.emergency_protocols
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
