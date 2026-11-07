// ============================================================
// ClaimWise — PATCH/DELETE /api/emergency-contacts/[id]
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { deleteEmergencyContact, updateEmergencyContact } from "@/lib/vault";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  relationship: z.string().trim().max(80).optional().default(""),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-()\s]{7,20}$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address.").max(160).optional().or(z.literal("")),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid contact details." },
      { status: 400 }
    );
  }
  if (!parsed.data.phone && !parsed.data.email) {
    return NextResponse.json(
      { success: false, error: "Add at least a phone number or an email address." },
      { status: 400 }
    );
  }
  const { id } = await params;
  try {
    const contact = await updateEmergencyContact(id, session.sub, parsed.data);
    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, contact });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not update the contact." },
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
    await deleteEmergencyContact(id, session.sub);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not delete the contact." },
      { status: 500 }
    );
  }
}
