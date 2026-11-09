// ============================================================
// ClaimWise — POST /api/security/totp/setup
//
// Steps 1 of authenticator enrollment: generates a fresh TOTP
// seed, seals it (AES-256-GCM) into the totp_secrets row as
// NOT-yet-confirmed, and returns the otpauth:// URI plus a QR
// image data URL for the authenticator app. Nothing is activated
// until /api/security/totp/enable verifies the first code.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSessionFromRequest } from "@/lib/auth";
import { encryptTotpSecret, generateTotpSecret, totpUri } from "@/lib/totp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const secret = generateTotpSecret();
  const cipher = await encryptTotpSecret(secret, session.sub);

  const { error } = await supabase
    .from("totp_secrets")
    .upsert(
      {
        user_id: session.sub,
        secret_cipher: cipher,
        confirmed: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  if (error) {
    console.error("[totp:setup] upsert failed:", error.message);
    return NextResponse.json({ success: false, error: "Could not prepare the authenticator setup." }, { status: 500 });
  }

  const uri = totpUri(secret, session.email);
  const qrDataUrl = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
  // Also return the seed so users who prefer manual key entry can type it.
  return NextResponse.json({ success: true, uri, qrDataUrl, secret });
}
