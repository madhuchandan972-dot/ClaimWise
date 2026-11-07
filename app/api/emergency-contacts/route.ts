// ============================================================
// ClaimWise — GET/POST /api/emergency-contacts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { createEmergencyContact, listEmergencyContacts } from "@/lib/vault";
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

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  try {
    return NextResponse.json({
      success: true,
      contacts: await listEmergencyContacts(session.sub),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not load contacts." },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
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
  try {
    const contact = await createEmergencyContact(session.sub, parsed.data);
    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not save the contact." },
      { status: 500 }
    );
  }
}
