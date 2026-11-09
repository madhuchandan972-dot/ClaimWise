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
import { decryptTotpSecret, verifyTotp } from "@/lib/totp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { code?: string; purpose?: string; method?: string }
    | null;
  const purpose = String(body?.purpose ?? "").trim() === "vault-file" ? "vault-file" : OTP_PURPOSE;

  // Two independent unlock methods share one elevation:
  //  • sms   — 6-digit code sent to the owner's profile mobile
  //  • totp  — 6-digit code from their enrolled authenticator app
  let otpResult: Awaited<ReturnType<typeof verifyOtp>> | { ok: true; provided: true } = {
    ok: false,
    error: "",
  };

  if (String(body?.method ?? "sms") === "totp") {
    const supabase = await createSupabaseServerClient();
    const { data: row } = await supabase
      .from("totp_secrets")
      .select("secret_cipher, confirmed")
      .eq("user_id", session.sub)
      .maybeSingle();

    if (row?.confirmed !== true || !row.secret_cipher) {
      otpResult = { ok: false, error: "No authenticator is enrolled. Use the SMS code or set one up on the Profile page." };
    } else {
      const { secret } = await decryptTotpSecret(row.secret_cipher);
      otpResult = verifyTotp(secret, String(body?.code ?? ""))
        ? { ok: true, provided: true }
        : { ok: false, error: "Wrong code — enter the current number from the authenticator app." };
    }
  } else {
    otpResult = await verifyOtp(session.sub, purpose, String(body?.code ?? ""));
  }

  const result = otpResult;
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error, lockout: "lockout" in result ? result.lockout : undefined },
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
