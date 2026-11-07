// ============================================================
// ClaimWise — GET /api/vault/overview
// Real counts for the signed-in user's vault. No placeholder data.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getWorkspace } from "@/lib/store";
import { getVaultOverview } from "@/lib/vault";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  try {
    // Creates a blank profile on first access, never sample records.
    const workspace = await getWorkspace(session.sub, session.email, session.name);
    const overview = await getVaultOverview(session.sub);

    return NextResponse.json({
      success: true,
      overview,
      user: {
        name: workspace.profile.name,
        email: session.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not load the vault overview." },
      { status: 503 }
    );
  }
}
