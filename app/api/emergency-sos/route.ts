// ============================================================
// ClaimWise — GET /api/emergency-sos
//
// Gathers vital emergency data in one round-trip:
// user profile, emergency contacts, and active health insurance
// for generating the emergency SOS WhatsApp broadcast.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getProfile } from "@/lib/store";
import { listEmergencyContacts, listInsuranceRecords } from "@/lib/vault";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  try {
    const [profile, contacts, insuranceList] = await Promise.all([
      getProfile(session.sub).catch(() => null),
      listEmergencyContacts(session.sub).catch(() => []),
      listInsuranceRecords(session.sub).catch(() => []),
    ]);

    // Find health insurance (preferred) or any active policy
    const healthPolicy =
      insuranceList.find((i) => i.policyType.toLowerCase().includes("health")) ||
      insuranceList[0] ||
      null;

    return NextResponse.json({
      success: true,
      user: {
        name: profile?.name || session.email.split("@")[0] || "Vault Owner",
        phone: profile?.phone || "",
        email: session.email,
        bloodGroup: (profile as unknown as Record<string, unknown>)?.bloodGroup || "",
      },
      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name,
        relationship: c.relationship,
        phone: c.phone,
        email: c.email,
      })),
      healthInsurance: healthPolicy
        ? {
            provider: healthPolicy.provider,
            policyType: healthPolicy.policyType,
            policyNumber: healthPolicy.policyNumber,
            policyholderName: healthPolicy.policyholderName,
            expiryDate: healthPolicy.expiryDate,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not prepare emergency data.",
      },
      { status: 500 }
    );
  }
}
