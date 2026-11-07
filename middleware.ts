// ============================================================
// ClaimWise — Route Protection
//
// Verifies the Supabase Auth session for every /dashboard/* page
// before rendering. The access token is validated server-side via
// supabase.auth.getUser() (a real JWT check against Supabase Auth
// — not just reading an unverified cookie), and refreshed tokens
// are written back to the outgoing cookies.
//
// Unauthenticated visitors are redirected to /login with a safe
// return URL. Each API route performs its own verification too —
// pages being visible is safe because data is only ever served by
// APIs.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    const next = request.nextUrl.pathname;
    if (next && next !== "/login") {
      loginUrl.searchParams.set("next", next);
    }
    // Carry over any refreshed cookies onto the redirect response so a
    // timeout/refresh racing the navigation is never lost.
    const redirect = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
