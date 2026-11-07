// ============================================================
// ClaimWise — PATCH/DELETE /api/insurance/[id]
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { listDocuments } from "@/lib/store";
import { deleteInsuranceRecord, updateInsuranceRecord } from "@/lib/vault";
import { z } from "zod";

const insuranceSchema = z.object({
  provider: z.string().trim().min(2).max(160),
  policyType: z.enum(["Life", "Health", "Vehicle", "Home", "Travel", "Other"]),
  policyNumber: z.string().trim().max(120).optional().default(""),
  policyholderName: z.string().trim().max(160).optional().default(""),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal(""))
    .nullable(),
  premiumAmount: z.number().min(0).max(1_000_000_000).nullable().optional(),
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
  const parsed = insuranceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid insurance details." },
      { status: 400 }
    );
  }
  const { id } = await params;
  try {
    const owned = new Set((await listDocuments(session.sub)).map((d) => d.id));
    const record = await updateInsuranceRecord(id, session.sub, {
      ...parsed.data,
      expiryDate: parsed.data.expiryDate || null,
      documentIds: parsed.data.documentIds.filter((docId) => owned.has(docId)),
    });
    if (!record) {
      return NextResponse.json({ success: false, error: "Policy not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, record });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not update the policy." },
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
    await deleteInsuranceRecord(id, session.sub);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not delete the policy." },
      { status: 500 }
    );
  }
}
