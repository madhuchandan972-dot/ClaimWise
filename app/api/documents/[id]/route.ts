// ============================================================
// ClaimWise — DELETE /api/documents/[id]
// Deletes a document. Only the owning user can delete it.
// Private file bytes are removed as well.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { deleteDocument, getDocument } from "@/lib/store";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;

  // Confirm ownership before deleting
  const doc = await getDocument(id, session.sub);
  if (!doc) {
    return NextResponse.json(
      { success: false, error: "Document not found." },
      { status: 404 }
    );
  }

  const deleted = await deleteDocument(id, session.sub);
  if (!deleted) {
    return NextResponse.json(
      { success: false, error: "Could not delete the document." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
