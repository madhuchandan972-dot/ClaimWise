// ============================================================
// ClaimWise — Supabase browser client
//
// For CLIENT components ('use client'). Uses @supabase/ssr so the
// session lives in cookies shared with the server-side client in
// lib/supabase/server.ts and middleware.ts.
//
// Credentials come exclusively from NEXT_PUBLIC_ variables, which
// are safe for the browser by design (publishable key ≠ secret).
// ============================================================

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
