// ============================================================
// ClaimWise — GET /api/eligibility
// Runs the transparent, rule-based eligibility engine over the
// catalogue with the signed-in student's approved profile data.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getWorkspace, listScholarships } from "@/lib/store";
import { computeAllEligibility } from "@/lib/eligibility";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const userData = await getWorkspace(session.sub, session.email, session.name);
  const scholarships = await listScholarships();
  const results = computeAllEligibility(
    userData.profile,
    scholarships,
    userData.documents
  );

  return NextResponse.json({
    success: true,
    results,
    catalogueEmpty: scholarships.length === 0,
    engine: "deterministic-rule-engine",
    note: "Eligibility output is computed transparently from your profile we store. Always verify with the official portal before applying.",
  });
}
