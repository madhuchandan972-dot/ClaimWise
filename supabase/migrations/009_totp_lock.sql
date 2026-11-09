-- ============================================================
-- ClaimWise — Migration 009: Authenticator-app (TOTP) lock
--
-- The OWNER can enroll a TOTP secret (Google Authenticator, Authy,
-- Microsoft Authenticator …). The secret is stored ONLY as an
-- AES-256-GCM encrypted blob — the database never sees the raw
-- base32 seed, so a DB leak cannot mint codes.
--
-- Scopes: vault-file elevation — same purpose as the SMS OTP lock;
-- either method grants the identical short-lived elevation cookie.
--
-- Run in Supabase → SQL editor.
-- ============================================================

create table if not exists public.totp_secrets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  secret_cipher text not null,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  enabled_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.totp_secrets enable row level security;

drop policy if exists "totp_secrets_owner_all" on public.totp_secrets;
create policy "totp_secrets_owner_all"
  on public.totp_secrets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
