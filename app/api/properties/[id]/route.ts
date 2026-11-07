// ============================================================
// ClaimWise — PATCH/DELETE /api/properties/[id]
// Only the owner may edit or delete a property record.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { listDocuments } from "@/lib/store";
import { deleteProperty, updateProperty } from "@/lib/vault";
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  try {
    const owned = new Set((await listDocuments(session.sub)).map((d) => d.id));
    const property = await updateProperty(id, session.sub, {
      ...parsed.data,
      registrationDate: parsed.data.registrationDate || null,
      documentIds: parsed.data.documentIds.filter((docId) => owned.has(docId)),
    });
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, property });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not update the property." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  try {
    await deleteProperty(id, session.sub);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not delete the property." },
      { status: 500 }
    );
  }
}
