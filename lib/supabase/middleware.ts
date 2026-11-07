// ============================================================
// ClaimWise — Supabase Edge middleware helper
//
// Runs inside middleware.ts. Refreshes the Supabase auth cookies
// (rotating access tokens are refreshed transparently once per
// request) and returns the authenticated user, if any.
//
// Driven by request/response cookies only — never accepts tokens
// from query strings or client-supplied headers.
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

export async function updateSupabaseSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the JWT server-side against Supabase Auth
  // (unlike getSession(), which is NOT verified).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
