// ============================================================
// ClaimWise — POST /api/otp/verify · DELETE /api/otp/verify
//
// POST: checks the code against the newest challenge (max 5
// attempts), consumes it and sets a 5-minute AES-encrypted
// HttpOnly "elevated" cookie. Purpose-bound — it only unlocks
// the action it was asked for.
// DELETE: revokes the elevation immediately.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  ELEVATION_COOKIE,
  ELEVATION_TTL_SECONDS,
  OTP_PURPOSE,
  elevationCookieOptions,
  sealElevationCookie,
  verifyOtp,
} from "@/lib/otp";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { code?: string; purpose?: string } | null;
  const purpose = String(body?.purpose ?? "").trim() === "vault-file" ? "vault-file" : OTP_PURPOSE;

  const result = await verifyOtp(session.sub, purpose, String(body?.code ?? ""));
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error, lockout: result.lockout },
      { status: 400 }
    );
  }

  const sealed = await sealElevationCookie(session.sub, purpose);
  const response = NextResponse.json({ success: true, elevatedFor: ELEVATION_TTL_SECONDS });
  response.cookies.set(ELEVATION_COOKIE, sealed, elevationCookieOptions());
  return response;
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  const response = NextResponse.json({ success: true, elevated: false });
  response.cookies.set(ELEVATION_COOKIE, "", { ...elevationCookieOptions(0), maxAge: 0 });
  return response;
}
