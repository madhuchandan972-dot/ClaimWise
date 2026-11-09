// ============================================================
// ClaimWise — POST /api/security/totp/enable
//
// Step 2 of authenticator enrollment: the owner types the first
// 6-digit code from the app; only a correct code flips the row
// to confirmed=true. From then on authenticator codes work for
// the sensitive-action lock.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { verifyTotp } from "@/lib/totp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const code = String(body?.code ?? "");

  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("totp_secrets")
    .select("id, secret_cipher, confirmed")
    .eq("user_id", session.sub)
    .maybeSingle();

  if (!row?.secret_cipher) {
    return NextResponse.json({ success: false, error: "Run Setup first — no authenticator is pending." }, { status: 400 });
  }

  const { decryptTotpSecret } = await import("@/lib/totp");
  const { secret } = await decryptTotpSecret(row.secret_cipher);

  if (!verifyTotp(secret, code)) {
    return NextResponse.json({ success: false, error: "Wrong code — open the authenticator and enter the current 6-digit number." }, { status: 400 });
  }

  const { error } = await supabase
    .from("totp_secrets")
    .update({ confirmed: true, enabled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", row.id);
  if (error) {
    console.error("[totp:enable] update failed:", error.message);
    return NextResponse.json({ success: false, error: "Could not save the authenticator enrollment." }, { status: 500 });
  }

  return NextResponse.json({ success: true, enrolled: true });
}
