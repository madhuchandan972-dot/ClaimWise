// ============================================================
// ClaimWise — GET/POST /api/financial
// Loans, debts, obligations and bank references. ClaimsWise never
// asks for banking passwords, PINs, CVVs or OTPs — and there is no
// column in which they could be stored.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { createFinancialRecord, listFinancialRecords } from "@/lib/vault";
import { z } from "zod";

const financialSchema = z.object({
  recordType: z.enum(["loan", "debt", "obligation", "bank_reference", "note"]),
  institution: z.string().trim().max(160).optional().default(""),
  description: z.string().trim().min(2).max(300),
  amount: z.number().min(0).max(1_000_000_000_000).nullable().optional(),
  outstandingAmount: z.number().min(0).max(1_000_000_000_000).nullable().optional(),
  accountReference: z.string().trim().max(120).optional().default(""),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal(""))
    .nullable(),
  notes: z.string().trim().max(2000).optional().default(""),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  try {
    return NextResponse.json({
      success: true,
      records: await listFinancialRecords(session.sub),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not load financial records." },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const parsed = financialSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid financial details." },
      { status: 400 }
    );
  }

  try {
    const record = await createFinancialRecord(session.sub, {
      ...parsed.data,
      dueDate: parsed.data.dueDate || null,
    });
    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not save the record." },
      { status: 500 }
    );
  }
}
