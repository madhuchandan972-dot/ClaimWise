// ============================================================
// ClaimWise — GET/POST /api/family
// GET  → everything the signed-in user can see about family access
// POST → invite a trusted family member by email
//
// The owner id always comes from the verified session. Invitations
// are not a back door: the invited person must be signed in with the
// exact invited email before the database will grant read access.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  createInvitation,
  listFamilyMembers,
  listReceivedInvitations,
  listSentInvitations,
  listSharedVaults,
} from "@/lib/vault";

import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(160),
  relationship: z.string().trim().max(80).optional().default("Family member"),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  try {
    const [invitations, members, received, shared] = await Promise.all([
      listSentInvitations(session.sub),
      listFamilyMembers(session.sub),
      listReceivedInvitations(session.email),
      listSharedVaults(session.sub),
    ]);

    return NextResponse.json({
      success: true,
      invitations,
      members,
      received,
      shared,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not load family access." },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid invitation." },
      { status: 400 }
    );
  }

  try {
    const invitation = await createInvitation(
      session.sub,
      session.email,
      parsed.data.email,
      parsed.data.relationship || "Family member"
    );
    return NextResponse.json({ success: true, invitation }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create the invitation.";
    const status = /already|own email/i.test(message) ? 409 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
