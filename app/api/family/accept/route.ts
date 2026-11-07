// ============================================================
// ClaimWise — POST /api/family/accept
// Accepts an invitation for the signed-in user. The database
// function checks the user's verified auth email against the
// invitation — a token alone is never enough.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { acceptInvitation } from "@/lib/vault";
import { z } from "zod";

const schema = z.object({ token: z.string().uuid("Invalid invitation token.") });

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid invitation." },
      { status: 400 }
    );
  }

  try {
    const ownerId = await acceptInvitation(parsed.data.token);
    return NextResponse.json({ success: true, ownerId });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not accept the invitation." },
      { status: 400 }
    );
  }
}
