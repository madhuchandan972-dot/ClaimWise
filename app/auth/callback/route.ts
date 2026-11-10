// ============================================================
// ClaimWise — GET /auth/callback
//
// Exchanges the PKCE `code` from Supabase Auth emails (email
// confirmation and password-reset links) for a session, then
// redirects to a safe in-app destination. Replaces the previous
// JWT cookie flow — no manual cookie signing needed here because
// the @supabase/ssr server client writes the session cookies.
//
// Failure handling: Supabase links are single-use and can expire.
// When the exchange fails on a /reset-password journey we route to
// /forgot-password with an honest error (instead of a bare 404-look
// bounce back to /login), so the user immediately understands they
// need a fresh link.
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
    console.error("[auth/callback] code exchange failed:", error.message);
  }

  // Missing/invalid/expired/already-used code.
  if (next.startsWith("/reset-password")) {
    return NextResponse.redirect(`${origin}/forgot-password?error=expired`);
  }
  return NextResponse.redirect(
    `${origin}/login?next=${encodeURIComponent(next)}`
  );
}
