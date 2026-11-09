// ============================================================
// ClaimWise — POST /api/digilocker/save
//
// Pulls ONE file the user selected from THEIR OWN DigiLocker
// (auth via the short-lived token cookie) directly from the
// DigiLocker server, validates it, and stores it in the vault
// through the exact same code path as a manual upload:
//   private Supabase Storage bucket + RLS-scoped documents row.
//
// No DigiLocker bytes are ever kept on our servers beyond the
// insert, and nothing is cached.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { addDocument, MAX_FILE_SIZE } from "@/lib/store";
import { DOCUMENT_CATEGORIES } from "@/lib/categories";
import type { DocumentType } from "@/lib/types";
import {
  DL_TOKEN_COOKIE,
  downloadFile,
  getDigilockerConfig,
  isDigilockerConfigured,
  tokenCookieOptions,
  unsealTokenCookie,
} from "@/lib/digilocker";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  if (!isDigilockerConfigured()) {
    return NextResponse.json(
      { success: false, error: "DigiLocker is not configured on this deployment." },
      { status: 501 }
    );
  }

  const config = getDigilockerConfig()!;
  const token = await unsealTokenCookie(request.cookies.get(DL_TOKEN_COOKIE)?.value);
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Your DigiLocker session has expired. Connect again." },
      { status: 440 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    fileId?: string;
    name?: string;
    category?: string;
    description?: string;
  } | null;

  const fileId = String(body?.fileId ?? "").trim();
  const name = String(body?.name ?? "").trim().replace(/\.(pdf|jpe?g|png)$/i, "").slice(0, 120);
  if (!fileId || !name) {
    return NextResponse.json({ success: false, error: "Select a file to save." }, { status: 400 });
  }

  const category = (DOCUMENT_CATEGORIES as string[]).includes(String(body?.category))
    ? (String(body?.category) as DocumentType)
    : "Other";

  try {
    const { data } = await downloadFile(fileId, token, config);

    if (data.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "This document is larger than the 5 MB vault limit. Download it from DigiLocker and upload it manually.",
        },
        { status: 413 }
      );
    }

    const result = await addDocument(session.sub, name, data.length, category, data, {
      description: (String(body?.description ?? "").trim() + " [Fetched from DigiLocker]").trim(),
      originalName: `${name}.pdf`,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, document: result.document });
  } catch (e) {
    if (e instanceof Error && e.message === "session-expired") {
      const response = NextResponse.json(
        { success: false, error: "Your DigiLocker session has expired. Connect again." },
        { status: 440 }
      );
      response.cookies.set(DL_TOKEN_COOKIE, "", { ...tokenCookieOptions(0), maxAge: 0 });
      return response;
    }
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Could not fetch the document from DigiLocker." },
      { status: 502 }
    );
  }
}
