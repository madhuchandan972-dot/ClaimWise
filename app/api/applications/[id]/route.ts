// ============================================================
// ClaimWise — PATCH /api/applications/[id]
// Applies a status transition.
//
// HARD RULE: submitted / under-verification / approved / rejected /
// more-info-required can only be recorded when the student sends
// confirmSubmitted: true — ClaimWise never marks an application
// as submitted without the student's explicit confirmation.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getWorkspace, updateApplicationDetails, updateApplicationStatus } from "@/lib/store";
import type { ApplicationStatus } from "@/lib/types";

const STATUSES: ApplicationStatus[] = [
  "not-started",
  "preparing",
  "awaiting-review",
  "ready-to-submit",
  "submitted",
  "under-verification",
  "approved",
  "rejected",
  "more-info-required",
];

const PATCH_BODY_WHITELIST_STATUSES = STATUSES;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: ApplicationStatus;
    notes?: string;
    nextAction?: string;
    confirmSubmitted?: boolean;
  };

  const userData = await getWorkspace(session.sub, session.email, session.name);
  void userData;

  // Notes / next-step only (no status transition).
  if (!body.status) {
    if (body.notes === undefined && body.nextAction === undefined) {
      return NextResponse.json(
        { success: false, error: "A valid application status, notes or next action is required." },
        { status: 400 }
      );
    }
    const details = await updateApplicationDetails(id, session.sub, {
      notes: typeof body.notes === "string" ? body.notes : undefined,
      nextAction: typeof body.nextAction === "string" ? body.nextAction : undefined,
    });
    if (!details.success) {
      return NextResponse.json(
        { success: false, error: details.error },
        { status: details.error?.includes("not found") ? 404 : 400 }
      );
    }
    return NextResponse.json({ success: true, application: details.application });
  }

  if (!PATCH_BODY_WHITELIST_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { success: false, error: "A valid application status is required." },
      { status: 400 }
    );
  }

  const result = await updateApplicationStatus(id, session.sub, body.status, {
    notes: body.notes,
    nextAction: body.nextAction,
    confirmSubmitted: body.confirmSubmitted === true,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.error?.includes("not found") ? 404 : 400 }
    );
  }

  return NextResponse.json({ success: true, application: result.application });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  const ws = await getWorkspace(session.sub, session.email, session.name);
  const app = ws.applications.find((a) => a.id === id);
  if (!app) {
    return NextResponse.json(
      { success: false, error: "Application not found." },
      { status: 404 }
    );
  }
  if (app.status === "submitted" || app.status === "approved") {
    return NextResponse.json(
      { success: false, error: "Submitted applications cannot be deleted here." },
      { status: 400 }
    );
  }
  const { deleteApplication } = await import("@/lib/store");
  const ok = await deleteApplication(id, session.sub);
  return NextResponse.json({ success: ok });
}
