-- ============================================================
-- ClaimWise — Migration 007: Vault reminders & expiry alerts
--
-- Documents gain an optional expiry date (passport, DL, policy
-- copies…). Insurance `expiry_date` and financial `due_date`
-- already exist from migration 003 and feed the same engine.
-- Run in Supabase → SQL editor, then restart the dev server.
-- ============================================================

alter table public.documents
  add column if not exists expiry_date date;
