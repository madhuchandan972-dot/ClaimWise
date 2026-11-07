// ============================================================
// ClaimWise — GET /auth/callback
//
// Exchanges the PKCE `code` from Supabase Auth emails (email
// confirmation and password-reset links) for a session, then
// redirects to a safe in-app destination. Replaces the previous
// JWT cookie flow — no manual cookie signing needed here because
// the @supabase/ssr server client writes the session cookies.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Only allow relative, same-origin destinations.
  let next = searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/dashboard";
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Missing/invalid/expired code — send the visitor back to login.
  return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(next)}`);
}
