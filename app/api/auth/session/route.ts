// ============================================================
// ClaimWise — GET /api/auth/session
// Returns the signed-in user (or 401). Used by the dashboard
// shell to personalise the UI and redirect guests.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getWorkspace } from "@/lib/store";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  const ws = await getWorkspace(session.sub, session.email, session.name);

  return NextResponse.json({
    success: true,
    user: {
      id: session.sub,
      email: session.email,
      name: session.name,
      isDemo: session.demo,
      profileComplete: ws.profile.profileComplete,
    },
  });
}
