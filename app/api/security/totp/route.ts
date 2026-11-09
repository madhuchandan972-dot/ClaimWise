// ============================================================
// ClaimWise — GET /api/security/totp   ·   DELETE /api/security/totp
//
// GET: is an authenticator enrolled + confirmed? (the Documents
// page uses this to offer "Use authenticator app" on the lock
// modal; the Profile page uses it to render the security panel)
// DELETE: turns the authenticator off (un-verifying enrollment —
// deliberate convenience trade-off; the session holder is the
// authenticated owner).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("totp_secrets")
    .select("confirmed, enabled_at")
    .eq("user_id", session.sub)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    enrolled: row?.confirmed === true,
    enabledAt: row?.enabled_at ?? null,
  });
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("totp_secrets")
    .delete()
    .eq("user_id", session.sub);
  if (error) {
    console.error("[totp:disable] delete failed:", error.message);
    return NextResponse.json({ success: false, error: "Could not turn off the authenticator." }, { status: 500 });
  }

  return NextResponse.json({ success: true, enrolled: false });
}
