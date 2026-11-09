-- ============================================================
-- ClaimWise — Migration 010: Share links with expiry
--
-- A share link is a time-boxed capability token. The OWNER can
-- publish:
--   scope = 'document'  → exactly one stored document
--   scope = 'vault'     → the whole vault (metadata + files)
--
-- The link dies automatically at expires_at and can be revoked
-- earlier at any time. view_count records how often anybody used
-- it — transparency, not tracking.
--
-- Run in Supabase → SQL editor.
-- ============================================================

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  scope text not null default 'document'
    check (scope in ('document', 'vault')),
  document_id uuid references public.documents (id) on delete cascade,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  view_count int not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),

  -- A document share must always point at a real document.
  constraint share_links_document_required
    check (scope <> 'document' or document_id is not null)
);
create index if not exists share_links_user_idx
  on public.share_links (user_id, created_at desc);

alter table public.share_links enable row level security;

-- OWNER: full control over their own links.
drop policy if exists "share_links_owner_all" on public.share_links;
create policy "share_links_owner_all"
  on public.share_links
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- NOTE: no anon policy on purpose. Visitors resolve links through
-- the server, which validates the token (+ expiry + scope) before
-- using the service-role client. Exposing tokens to a plain
-- anon SELECT would leak them, so they simply cannot be listed.
