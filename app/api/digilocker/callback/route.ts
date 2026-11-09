// ============================================================
// ClaimWise — GET /api/digilocker/callback
//
// DigiLocker redirects here after the user authorises the app.
// We verify the CSRF state, exchange the one-time code for an
// access token and store it ONLY in a short-lived encrypted
// HttpOnly cookie. Nothing about the token is persisted in the
// database or exposed to the browser.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  DL_STATE_COOKIE,
  DL_TOKEN_COOKIE,
  exchangeCode,
  getDigilockerConfig,
  redirectUri,
  sealTokenCookie,
  tokenCookieOptions,
} from "@/lib/digilocker";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.redirect("/login?next=/dashboard/documents");
  }

  const config = getDigilockerConfig();
  if (!config) {
    return NextResponse.redirect("/dashboard/documents?dlgError=not-configured#digilocker");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const back = (err: string) => `/dashboard/documents?dlgError=${encodeURIComponent(err)}#digilocker`;

  if (oauthError) return NextResponse.redirect(back("You cancelled the DigiLocker authorisation."));
  if (!code || !state) return NextResponse.redirect(back("DigiLocker did not return an authorisation code."));

  const expectedState = request.cookies.get(DL_STATE_COOKIE)?.value;
  if (!expectedState || expectedState !== state) {
    return NextResponse.redirect(back("The DigiLocker response failed the security check. Please try again."));
  }

  try {
    const token = await exchangeCode(code, config, redirectUri(request));
    const sealed = await sealTokenCookie(token.accessToken);

    const response = NextResponse.redirect("/dashboard/documents?dlgRefetch=1#digilocker");
    response.cookies.set(DL_STATE_COOKIE, "", { ...tokenCookieOptions(0), maxAge: 0 });
    response.cookies.set(DL_TOKEN_COOKIE, sealed, tokenCookieOptions(token.expiresIn - 60));
    return response;
  } catch (e) {
    // "session-expired" can't occur here; surface any exchange problem plainly.
    if (e instanceof Error && e.message === "session-expired") {
      return NextResponse.redirect(back("The DigiLocker session expired. Connect again."));
    }
    return NextResponse.redirect(
      back(e instanceof Error ? e.message : "Could not connect to DigiLocker.")
    );
  }
}
