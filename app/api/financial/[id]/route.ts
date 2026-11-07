// ============================================================
// ClaimWise — PATCH/DELETE /api/financial/[id]
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { deleteFinancialRecord, updateFinancialRecord } from "@/lib/vault";
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;
  try {
    const record = await updateFinancialRecord(id, session.sub, {
      ...parsed.data,
      dueDate: parsed.data.dueDate || null,
    });
    if (!record) {
      return NextResponse.json({ success: false, error: "Record not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, record });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not update the record." },
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
    await deleteFinancialRecord(id, session.sub);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not delete the record." },
      { status: 500 }
    );
  }
}
