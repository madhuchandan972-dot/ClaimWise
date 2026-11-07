// ============================================================
// ClaimWise — GET/POST /api/properties
// Owner-scoped property records. The user id always comes from the
// verified Supabase session, never from the request body.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { listDocuments } from "@/lib/store";
import { createProperty, listProperties, vaultError } from "@/lib/vault";
import { z } from "zod";

const propertySchema = z.object({
  propertyName: z.string().trim().min(2).max(120),
  propertyType: z.enum(["Residential", "Commercial", "Land", "Agricultural", "Other"]),
  location: z.string().trim().max(300).optional().default(""),
  ownershipDetails: z.string().trim().max(1000).optional().default(""),
  registrationNumber: z.string().trim().max(120).optional().default(""),
  registrationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal(""))
    .nullable(),
  notes: z.string().trim().max(2000).optional().default(""),
  documentIds: z.array(z.string()).max(50).optional().default([]),
});

async function validDocumentIds(userId: string, ids: string[]) {
  if (ids.length === 0) return [];
  const owned = new Set((await listDocuments(userId)).map((d) => d.id));
  return ids.filter((id) => owned.has(id));
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  try {
    return NextResponse.json({
      success: true,
      properties: await listProperties(session.sub),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not load properties." },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const parsed = propertySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid property details." },
      { status: 400 }
    );
  }

  try {
    const input = {
      ...parsed.data,
      registrationDate: parsed.data.registrationDate || null,
      documentIds: await validDocumentIds(session.sub, parsed.data.documentIds),
    };
    const property = await createProperty(session.sub, input);
    return NextResponse.json({ success: true, property }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the property.";
    console.error("[POST /api/properties]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
