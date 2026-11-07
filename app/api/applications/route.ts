// ============================================================
// ClaimWise — GET/POST /api/applications
// GET  → list the student's scholarship applications
// POST → create (or return the existing) application for a
//        scholarship. New applications always start as
//        "preparing" — never auto-submitted.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { createApplication, getScholarship, listApplications } from "@/lib/store";
import { computeEligibility } from "@/lib/eligibility";
import { getWorkspace } from "@/lib/store";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  const userData = await getWorkspace(session.sub, session.email, session.name);
  return NextResponse.json({
    success: true,
    applications: await listApplications(session.sub),
    profileComplete: userData.profile.profileComplete,
  });
}
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const { scholarshipId } = (await request.json().catch(() => ({}))) as {
    scholarshipId?: string;
  };
  if (!scholarshipId) {
    return NextResponse.json(
      { success: false, error: "scholarshipId is required." },
      { status: 400 }
    );
  }

  const scholarship = await getScholarship(scholarshipId);
  if (!scholarship) {
    return NextResponse.json(
      { success: false, error: "Scholarship not found." },
      { status: 404 }
    );
  }

  // Run the eligibility check on create so the assistant's first
  // step is grounded in the transparent engine output.
  const userData = await getWorkspace(session.sub, session.email, session.name);
  const eligibility = computeEligibility(userData.profile, scholarship, userData.documents);

  const existing = (await listApplications(session.sub)).find(
    (a) => a.scholarshipId === scholarship.id
  );
  const app = await createApplication(session.sub, scholarship);
  if (!app) {
    return NextResponse.json(
      { success: false, error: "Could not create the application." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, application: app, eligibility },
    { status: existing ? 200 : 201 }
  );
}
