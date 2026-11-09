// ============================================================
// ClaimWise — POST /api/otp/request
//
// Sends a fresh 6-digit code by SMS to the OWNER's profile
// mobile for a sensitive-action purpose (rate limited, hashed
// at rest). The code itself never appears in the response —
// except in an explicitly enabled dev bypass for local testing.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { OTP_PURPOSE, requestOtp } from "@/lib/otp";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const purpose = await resolvePurpose(request);
  const result = await requestOtp(session.sub, purpose);

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 429 });
  }

  return NextResponse.json({
    success: true,
    maskedPhone: result.maskedPhone,
    expiresAt: result.expiresAt,
    devCode: result.devCode,
  });
}

async function resolvePurpose(request: NextRequest): Promise<string> {
  const body = await request.json().catch(() => null);
  const p = String(body?.purpose ?? "").trim();
  // Only recognised purposes, so the cookie audience can't be widened.
  return p === "vault-file" ? p : OTP_PURPOSE;
}
