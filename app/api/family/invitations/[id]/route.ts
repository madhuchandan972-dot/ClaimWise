// ============================================================
// ClaimWise — DELETE /api/family/invitations/[id]
// Revokes a pending invitation, or removes an already accepted
// family member's access. Owner-only (enforced again by RLS).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { revokeInvitation } from "@/lib/vault";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const revoked = await revokeInvitation(id, session.sub);
    if (!revoked) {
      return NextResponse.json(
        { success: false, error: "Invitation not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not revoke access." },
      { status: 500 }
    );
  }
}
