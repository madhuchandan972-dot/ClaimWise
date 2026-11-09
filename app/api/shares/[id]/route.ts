// ============================================================
// ClaimWise — DELETE /api/shares/[id]
//
// Revokes one of the owner's share links instantly: the public
// URL stops resolving on the very next request.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ success: false, error: "Unknown share link." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("share_links")
    .update({ revoked: true })
    .eq("id", id)
    .eq("user_id", session.sub); // ownership is enforced, not assumed

  if (error) {
    console.error("[shares:revoke] failed:", error.message);
    return NextResponse.json({ success: false, error: "Could not revoke the share link." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
