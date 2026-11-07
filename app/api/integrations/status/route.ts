// ============================================================
// ClaimWise — GET /api/integrations/status
// Reports which optional integrations are configured so the UI
// can show real status instead of pretending. Never exposes
// any key material.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAiAvailability } from "@/lib/ai";

export async function GET(_request: NextRequest) {
  const session = await getSessionFromRequest(_request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    ai: getAiAvailability(),
    gmail:
      Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET)
        ? "ready"
        : "not-configured",
  });
}
