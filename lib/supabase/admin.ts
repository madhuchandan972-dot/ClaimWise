// ============================================================
// ClaimWise — Supabase service-role client
//
// Narrow, deliberate use ONLY for public share-link pages:
// an anonymous visitor has no session of their own, so the ONLY
// way to resolve a valid share (and stream its bytes from the
// private `documents` bucket) is the elevated service role.
//
// Rules this module lives by:
//   1. The key is read from env, never logged, never returned.
//   2. Call sites MUST validate the share token (unexpired,
//      unrevoked, doc in scope) BEFORE using this client —
//      see app/api/shares/view/** and app/s/[token]/page.tsx.
//   3. When SUPABASE_SERVICE_ROLE_KEY is missing the factory
//      throws a clean, honest error the UI can present.
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Share-link viewing is not configured on this deployment (missing SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
