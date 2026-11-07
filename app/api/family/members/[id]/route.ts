// ============================================================
// ClaimWise — DELETE /api/family/members/[id]
// Removes an accepted family member's access (owner-only).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { removeFamilyMember } from "@/lib/vault";

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
    const removed = await removeFamilyMember(id, session.sub);
    if (!removed) {
      return NextResponse.json(
        { success: false, error: "Family member not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not remove access." },
      { status: 500 }
    );
  }
}
