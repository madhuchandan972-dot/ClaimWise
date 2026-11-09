// ============================================================
// ClaimWise — GET /api/digilocker/start
//
// Begins the OFFICIAL DigiLocker OAuth flow: redirects the user
// to the government's own authorize page where THEY log into
// their Aadhaar-linked DigiLocker and approve this app. A CSRF
// state cookie is set and verified in the callback.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  DL_STATE_COOKIE,
  getDigilockerConfig,
  redirectUri,
  tokenCookieOptions,
} from "@/lib/digilocker";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const config = getDigilockerConfig();
  if (!config) {
    return NextResponse.json(
      {
        success: false,
        error:
          "DigiLocker is not configured on this deployment. Partner credentials (DIGILOCKER_CLIENT_ID / DIGILOCKER_CLIENT_SECRET) are required from https://partners.digilocker.gov.in.",
      },
      { status: 501 }
    );
  }

  const state = `dlg-${crypto.randomUUID()}`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: redirectUri(request),
    state,
  });

  const response = NextResponse.redirect(`${config.authorizeUrl}?${params.toString()}`);
  response.cookies.set(DL_STATE_COOKIE, state, { ...tokenCookieOptions(600), maxAge: 600 });
  return response;
}
