// ============================================================
// ClaimWise — GET/POST /api/documents
// GET  → list the signed-in user's documents
// POST → upload a document (title, category, description, file)
//
// Files are stored in a PRIVATE Supabase Storage bucket and served
// only through the authorisation-checked /api/documents/[id]/file
// route. Every row is scoped to the authenticated user; RLS enforces
// the same rule in Postgres.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  addDocument,
  MAX_FILE_SIZE,
  getWorkspace,
  listDocuments,
} from "@/lib/store";
import type { DocumentType } from "@/lib/types";

const DOCUMENT_CATEGORIES: DocumentType[] = [
  "AadhaarCard",
  "PANCard",
  "PropertyDocument",
  "InsuranceDocument",
  "BankDocument",
  "IncomeCertificate",
  "CasteCertificate",
  "MarksCard",
  "TransferCertificate",
  "Other",
];

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  // Ensures the blank profile exists before reading
  await getWorkspace(session.sub, session.email, session.name);
  const documents = await listDocuments(session.sub);
  return NextResponse.json({ success: true, documents });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const rawType = String(formData.get("category") ?? formData.get("type") ?? "Other");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file was uploaded." },
        { status: 400 }
      );
    }
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Add a title for this document." },
        { status: 400 }
      );
    }
    if (title.length > 120) {
      return NextResponse.json(
        { success: false, error: "Document titles can be at most 120 characters." },
        { status: 400 }
      );
    }
    if (description.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Descriptions can be at most 1,000 characters." },
        { status: 400 }
      );
    }
    if (!DOCUMENT_CATEGORIES.includes(rawType as DocumentType)) {
      return NextResponse.json(
        { success: false, error: "Invalid document category." },
        { status: 400 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: "The selected file is empty." },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`,
        },
        { status: 413 }
      );
    }

    const safeOriginalName = file.name
      .replace(/[/\\]/g, "-")
      .replace(/[\u0000-\u001f]/g, "")
      .slice(0, 200) || "document";

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await addDocument(
      session.sub,
      title,
      file.size,
      rawType as DocumentType,
      buffer,
      { description, originalName: safeOriginalName }
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, document: result.document },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/documents] Upload failed:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
