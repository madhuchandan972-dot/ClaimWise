// ============================================================
// ClaimWise — POST /api/documents/[id]/analyze
//
// Runs document intelligence over one document:
//   - With GOOGLE_GEMINI_API_KEY: real Gemini extraction
//   - Without it: clearly-labelled simulated demo extraction
//
// Returns the extraction result for STUDENT REVIEW. Nothing is
// written to the profile until the student approves it via
// POST /api/profile.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getFile, getDocument, updateDocument } from "@/lib/store";
import { runDocumentExtraction, getAiAvailability } from "@/lib/ai";
import { pushNotification } from "@/lib/store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const doc = await getDocument(id, session.sub);
  if (!doc) {
    return NextResponse.json(
      { success: false, error: "Document not found." },
      { status: 404 }
    );
  }

  if (doc.status === "processed") {
    return NextResponse.json({
      success: true,
      document: doc,
      alreadyProcessed: true,
      aiAvailable: getAiAvailability(),
    });
  }

  // Seeded sample documents have no real file bytes.
  const file = await getFile(id, session.sub);
  if (!file) {
    return NextResponse.json(
      {
        success: false,
        error:
          "This is a sample document from the demo dataset and has no real file content. Upload your own document to run analysis.",
      },
      { status: 409 }
    );
  }

  const result = await runDocumentExtraction({
    fileName: file.name,
    mimeType: file.mimeType,
    fileBuffer: file.data,
    declaredType: doc.type,
  });

  if (result.mode === "error") {
    // AI is configured but the provider call failed — a proper,
    // honest error (no silent substitution of simulated data).
    return NextResponse.json(
      { success: false, error: result.reason },
      { status: 503 }
    );
  }

  // Persist the extraction onto the document
  const updated = await updateDocument(id, session.sub, {
    type: result.documentType,
    status: "processed",
    extractedData: result.extractedData,
    extractionMode: result.mode,
  });

  if (result.mode === "simulated") {
    try {
      await pushNotification(
        session.sub,
        "reminder",
        "Document analysed in demo mode",
        `"${doc.name}" was analysed using simulated demo data (no AI key configured). Review the extracted fields before applying them.`,
        "/dashboard/documents/intelligence"
      );
    } catch (notifyError) {
      // Analysis already succeeded; a notification failure is not fatal.
      console.error("[analyze] notification failed:", notifyError);
    }
  }

  return NextResponse.json({
    success: true,
    document: updated,
    extraction: result,
    aiAvailable: getAiAvailability(),
  });
}
