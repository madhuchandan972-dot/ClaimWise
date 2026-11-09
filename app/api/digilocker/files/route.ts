// ============================================================
// ClaimWise — /api/digilocker/files
//
// GET    → reports { configured, linked, files: [...] } using the
//          user's own DigiLocker session (encrypted HttpOnly token
//          cookie). Files are the user's own government documents,
//          straight from the official server.
// DELETE → disconnects (clears the token cookie). No server state.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  DL_TOKEN_COOKIE,
  getDigilockerConfig,
  isDigilockerConfigured,
  listFiles,
  tokenCookieOptions,
  unsealTokenCookie,
} from "@/lib/digilocker";
import type { DlgFile } from "@/lib/digilocker";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  if (!isDigilockerConfigured()) {
    return NextResponse.json({ success: true, configured: false, linked: false, files: [] });
  }

  const config = getDigilockerConfig()!;
  const token = await unsealTokenCookie(request.cookies.get(DL_TOKEN_COOKIE)?.value);

  if (!token) {
    return NextResponse.json({ success: true, configured: true, linked: false, files: [] });
  }

  try {
    const files = await listFiles(token, config);
    return NextResponse.json({ success: true, configured: true, linked: true, files });
  } catch (e) {
    if (e instanceof Error && e.message === "session-expired") {
      const response = NextResponse.json({
        success: true,
        configured: true,
        linked: false,
        expired: true,
        files: [] as DlgFile[],
      });
      response.cookies.set(DL_TOKEN_COOKIE, "", { ...tokenCookieOptions(0), maxAge: 0 });
      return response;
    }
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Could not reach DigiLocker." },
      { status: 502 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  const response = NextResponse.json({ success: true, linked: false });
  response.cookies.set(DL_TOKEN_COOKIE, "", { ...tokenCookieOptions(0), maxAge: 0 });
  return response;
}
