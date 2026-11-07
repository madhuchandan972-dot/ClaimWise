// ============================================================
// ClaimWise — GET /api/shared/[ownerId]
// Read-only vault view for an accepted family member.
// The RLS policy on every table is the real gate; this API also
// rejects non-members explicitly so the UI never renders a shell
// full of confusing empty sections.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getSharedVault } from "@/lib/vault";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const { ownerId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(ownerId)) {
    return NextResponse.json({ success: false, error: "Vault not found." }, { status: 404 });
  }

  try {
    const vault = await getSharedVault(ownerId, session.sub);
    if (!vault) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this vault." },
        { status: 403 }
      );
    }

    const { listDocuments } = await import("@/lib/store");
    return NextResponse.json({
      success: true,
      vault,
      documents: await listDocuments(ownerId),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not load the shared vault." },
      { status: 500 }
    );
  }
}
