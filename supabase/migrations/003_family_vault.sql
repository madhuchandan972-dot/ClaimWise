-- ============================================================
-- ClaimWise — Emergency Family Vault (ADDITIVE ONLY)
--
-- Run once in Supabase → SQL editor, after 001 and 002.
-- Creates:
--   • properties / financial_records / insurance_records /
--     emergency_contacts / family_members / family_invitations /
--     saved_scholarships
--   • household read access for accepted family members
--   • Row Level Security on every user-specific table
--   • scholarship verification columns + saved scholarship links
--   • private storage read access for accepted family members
--
-- No sample, demo or fictional records are inserted. Every new
-- account starts with a completely empty vault.
-- This script is additive: it never drops or truncates a table.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Profiles — scholarship education level
-- ──────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists education_level text not null default '';

-- ──────────────────────────────────────────────────────────────
-- 2. Documents — vault title/description metadata
--    (name stays the user-facing title; type stays the category)
-- ──────────────────────────────────────────────────────────────

alter table public.documents
  add column if not exists description text not null default '';
alter table public.documents
  add column if not exists original_name text not null default '';

-- ──────────────────────────────────────────────────────────────
-- 3. Vault tables
-- ──────────────────────────────────────────────────────────────

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_name text not null,
  property_type text not null default 'Residential',
  location text not null default '',
  ownership_details text not null default '',
  registration_number text not null default '',
  registration_date date,
  notes text not null default '',
  document_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_user_id_idx on public.properties (user_id, created_at desc);

create table if not exists public.financial_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  record_type text not null default 'loan',
  institution text not null default '',
  description text not null,
  amount numeric(14, 2),
  outstanding_amount numeric(14, 2),
  account_reference text not null default '',
  due_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists financial_records_user_id_idx on public.financial_records (user_id, created_at desc);

create table if not exists public.insurance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  policy_type text not null default 'Life',
  policy_number text not null default '',
  policyholder_name text not null default '',
  expiry_date date,
  premium_amount numeric(14, 2),
  notes text not null default '',
  document_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists insurance_records_user_id_idx on public.insurance_records (user_id, created_at desc);

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  relationship text not null default '',
  phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists emergency_contacts_user_id_idx on public.emergency_contacts (user_id, created_at desc);

-- ──────────────────────────────────────────────────────────────
-- 4. Family access
-- ──────────────────────────────────────────────────────────────

create table if not exists public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  owner_email text not null default '',
  email text not null,
  relationship text not null default 'Family member',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null
);
create index if not exists family_invitations_owner_idx on public.family_invitations (owner_id, created_at desc);
create index if not exists family_invitations_email_idx on public.family_invitations (lower(email));
create unique index if not exists family_invitations_token_idx on public.family_invitations (token);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  member_id uuid not null references auth.users (id) on delete cascade,
  email text not null default '',
  relationship text not null default 'Family member',
  permissions text not null default 'view'
    check (permissions in ('view')),
  invitation_id uuid references public.family_invitations (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (owner_id, member_id)
);
create index if not exists family_members_owner_idx on public.family_members (owner_id);
create index if not exists family_members_member_idx on public.family_members (member_id);

-- ──────────────────────────────────────────────────────────────
-- 5. Scholarship catalogue extension + saved scholarships
-- ──────────────────────────────────────────────────────────────

alter table public.scholarships
  add column if not exists state text[] not null default '{}';
alter table public.scholarships
  add column if not exists education_level text not null default '';
alter table public.scholarships
  add column if not exists course text[] not null default '{}';
alter table public.scholarships
  add column if not exists category_requirements text[] not null default '{}';
alter table public.scholarships
  add column if not exists family_income_criteria text not null default '';
alter table public.scholarships
  add column if not exists max_income bigint;
alter table public.scholarships
  add column if not exists scholarship_type text not null default '';
alter table public.scholarships
  add column if not exists application_instructions text not null default '';
alter table public.scholarships
  add column if not exists source_url text not null default '';
alter table public.scholarships
  add column if not exists verification_status text not null default 'needs_verification'
    check (verification_status in ('verified', 'needs_verification'));
alter table public.scholarships
  add column if not exists last_verified_at timestamptz;

create table if not exists public.saved_scholarships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scholarship_id text not null references public.scholarships (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, scholarship_id)
);
create index if not exists saved_scholarships_user_idx on public.saved_scholarships (user_id, created_at desc);

-- ──────────────────────────────────────────────────────────────
-- 6. Access helper — owner OR accepted family member
--    SECURITY DEFINER so it can read family_members without
--    recursively applying that table's RLS. It only returns a
--    boolean for a specific owner uuid, never row contents.
-- ──────────────────────────────────────────────────────────────

create or replace function public.has_vault_access(target_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_owner = auth.uid()
      or exists (
        select 1
        from public.family_members fm
        where fm.owner_id = target_owner
          and fm.member_id = auth.uid()
      );
$$;

revoke all on function public.has_vault_access(uuid) from public;
grant execute on function public.has_vault_access(uuid) to authenticated;

-- ──────────────────────────────────────────────────────────────
-- 7. Invitation acceptance — validates the signed-in user's
--    verified email against the invitation, then grants
--    read-only family access. Cannot be spoofed from the client
--    because the email is read from auth.users, not the request.
-- ──────────────────────────────────────────────────────────────

create or replace function public.accept_family_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_inv public.family_invitations%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    raise exception 'No verified email on this account';
  end if;

  select * into v_inv
    from public.family_invitations
    where token = p_token
    for update;

  if not found then
    raise exception 'Invitation not found';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'This invitation is no longer pending';
  end if;
  if lower(v_inv.email) <> lower(v_email) then
    raise exception 'This invitation was sent to a different email address';
  end if;
  if v_inv.owner_id = v_uid then
    raise exception 'You cannot accept your own invitation';
  end if;

  insert into public.family_members (owner_id, member_id, email, relationship, invitation_id, permissions)
  values (v_inv.owner_id, v_uid, lower(v_email), v_inv.relationship, v_inv.id, 'view')
  on conflict (owner_id, member_id) do nothing;

  update public.family_invitations
    set status = 'accepted', accepted_at = now(), accepted_by = v_uid
    where id = v_inv.id;

  return v_inv.owner_id;
end;
$$;

revoke all on function public.accept_family_invitation(uuid) from public;
grant execute on function public.accept_family_invitation(uuid) to authenticated;

-- ──────────────────────────────────────────────────────────────
-- 8. Row Level Security
--    Owners have full access to their own rows. Accepted family
--    members get READ-ONLY access to the owner's vault records.
--    Nobody else can read or write anything.
-- ──────────────────────────────────────────────────────────────

alter table public.properties enable row level security;
alter table public.financial_records enable row level security;
alter table public.insurance_records enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invitations enable row level security;
alter table public.saved_scholarships enable row level security;

-- profiles: owner + family member read (name/email for shared vault)
drop policy if exists "profiles_family_read" on public.profiles;
create policy "profiles_family_read" on public.profiles
  for select to authenticated
  using (public.has_vault_access(id));

-- documents: owner write, family read
drop policy if exists "documents_family_read" on public.documents;
create policy "documents_family_read" on public.documents
  for select to authenticated
  using (public.has_vault_access(user_id));

-- properties
drop policy if exists "properties_owner_all" on public.properties;
create policy "properties_owner_all" on public.properties
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "properties_family_read" on public.properties;
create policy "properties_family_read" on public.properties
  for select to authenticated
  using (public.has_vault_access(user_id));

-- financial records
drop policy if exists "financial_records_owner_all" on public.financial_records;
create policy "financial_records_owner_all" on public.financial_records
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "financial_records_family_read" on public.financial_records;
create policy "financial_records_family_read" on public.financial_records
  for select to authenticated
  using (public.has_vault_access(user_id));

-- insurance records
drop policy if exists "insurance_records_owner_all" on public.insurance_records;
create policy "insurance_records_owner_all" on public.insurance_records
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "insurance_records_family_read" on public.insurance_records;
create policy "insurance_records_family_read" on public.insurance_records
  for select to authenticated
  using (public.has_vault_access(user_id));

-- emergency contacts
drop policy if exists "emergency_contacts_owner_all" on public.emergency_contacts;
create policy "emergency_contacts_owner_all" on public.emergency_contacts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "emergency_contacts_family_read" on public.emergency_contacts;
create policy "emergency_contacts_family_read" on public.emergency_contacts
  for select to authenticated
  using (public.has_vault_access(user_id));

-- family invitations: owner manages; invitee can see their own pending/accepted invitation
drop policy if exists "family_invitations_owner_all" on public.family_invitations;
create policy "family_invitations_owner_all" on public.family_invitations
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "family_invitations_invitee_read" on public.family_invitations;
create policy "family_invitations_invitee_read" on public.family_invitations
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- family members: owner can see/manage; member can see their own membership
drop policy if exists "family_members_owner_all" on public.family_members;
create policy "family_members_owner_all" on public.family_members
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "family_members_member_read" on public.family_members;
create policy "family_members_member_read" on public.family_members
  for select to authenticated
  using (auth.uid() = member_id);

drop policy if exists "family_members_member_delete" on public.family_members;
create policy "family_members_member_delete" on public.family_members
  for delete to authenticated
  using (auth.uid() = member_id);

-- saved scholarships
drop policy if exists "saved_scholarships_owner_all" on public.saved_scholarships;
create policy "saved_scholarships_owner_all" on public.saved_scholarships
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- 9. Private storage — accepted family members may READ the
--    owner's document bytes only. Owners keep the existing
--    full-access policy from 001; writes are never granted here.
-- ──────────────────────────────────────────────────────────────

drop policy if exists "documents_bucket_family_read" on storage.objects;
create policy "documents_bucket_family_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and exists (
      select 1
      from public.family_members fm
      where fm.owner_id::text = (storage.foldername(name))[1]
        and fm.member_id = auth.uid()
    )
  );

-- Done. Every table is empty until a real user adds their own data.
