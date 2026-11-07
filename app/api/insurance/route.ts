// ============================================================
// ClaimWise — GET/POST /api/insurance
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { listDocuments } from "@/lib/store";
import { createInsuranceRecord, listInsuranceRecords } from "@/lib/vault";
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
      records: await listInsuranceRecords(session.sub),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not load insurance records." },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
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
  try {
    const record = await createInsuranceRecord(session.sub, {
      ...parsed.data,
      expiryDate: parsed.data.expiryDate || null,
      documentIds: await validDocumentIds(session.sub, parsed.data.documentIds),
    });
    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not save the policy." },
      { status: 500 }
    );
  }
}
