// ============================================================
// ClaimWise — POST /api/auth/logout
// Signs the user out of Supabase Auth. The @supabase/ssr server
// client clears the session cookies on this response, and the
// access token is revoked server-side — no client-side-only
// "cookie deletion" compromise.
// ============================================================

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
