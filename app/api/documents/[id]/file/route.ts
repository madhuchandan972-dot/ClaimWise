// ============================================================
// ClaimWise — GET /api/documents/[id]/file
//
// Streams a stored document inline (preview) or as a download.
// Uploaded files are never public: a valid session is required and
// RLS/ownership checks decide whether the viewer is the owner or an
// accepted family member. Nobody else can resolve the bytes.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getFileForViewer } from "@/lib/store";

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
