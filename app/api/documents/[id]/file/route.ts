// ============================================================
// ClaimWise — GET /api/documents/[id]/file
//
// Streams a stored document inline (preview) or as a download.
// Uploaded files are never public: a valid session is required and
// RLS/ownership checks decide whether the viewer is the owner or an
// accepted family member. Nobody else can resolve the bytes.
//
// SENSITIVE-ACTION LOCK (owner only): before the OWNER's bytes are
// released, a fresh 5-minute OTP elevation is required — a code sent
// by SMS to the owner's own profile mobile. Family members opened
// under the owner's explicit invitation keep exactly the same access
// as before. The lock engages only when an SMS gateway (or an
// explicitly enabled dev bypass) is configured — otherwise it stays
// dormant and document access behaves as before.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getFileForViewer } from "@/lib/store";
import { ELEVATION_COOKIE, OTP_PURPOSE, ownerLockActive, verifyElevation } from "@/lib/otp";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const file = await getFileForViewer(id);

  if (!file) {
    return NextResponse.json(
      { success: false, error: "File not found or you do not have access to it." },
      { status: 404 }
    );
  }

  // Owner gate: the owner must re-confirm with their own mobile OTP
  // before bytes are released. Family viewers continue as invited.
  // The lock engages only when an SMS channel exists (or a dev
  // bypass is enabled) — a deployment without any provider never
  // bricks document access, it simply has no lock yet.
  if (file.userId === session.sub && (await ownerLockActive(session.sub))) {
    const elevated = await verifyElevation(
      request.cookies.get(ELEVATION_COOKIE)?.value,
      session.sub,
      OTP_PURPOSE
    );
    if (!elevated) {
      return NextResponse.json(
        {
          success: false,
          otpRequired: true,
          error: "Confirm your identity with a one-time code sent to your phone to open documents.",
        },
        { status: 403 }
      );
    }
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const filename = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "document";

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(filename)}"`,
      "Content-Length": String(file.data.byteLength),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
