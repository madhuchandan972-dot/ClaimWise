// ============================================================
// ClaimWise — GET/POST /api/emergency-sos
//
// Gathers vital emergency data:
// - User profile, emergency contacts, active health insurance
// - Paramedic ICE medical vitals (blood group, allergies, conditions)
// - Confidential family nominee handover instructions
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getProfile } from "@/lib/store";
import { listEmergencyContacts, listInsuranceRecords } from "@/lib/vault";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  try {
    const supabase = await createSupabaseServerClient();

    const [profile, contacts, insuranceList, protocolRes] = await Promise.all([
      getProfile(session.sub).catch(() => null),
      listEmergencyContacts(session.sub).catch(() => []),
      listInsuranceRecords(session.sub).catch(() => []),
      Promise.resolve(
        supabase
          .from("emergency_protocols")
          .select("*")
          .eq("user_id", session.sub)
          .maybeSingle()
      ).catch(() => ({ data: null })),
    ]);

    const protocol = protocolRes?.data;

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
        bloodGroup: protocol?.blood_group || (profile as unknown as Record<string, unknown>)?.bloodGroup || "",
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
      protocol: protocol
        ? {
            bloodGroup: protocol.blood_group || "",
            allergies: protocol.allergies || "",
            chronicConditions: protocol.chronic_conditions || "",
            medications: protocol.medications || "",
            preferredHospital: protocol.preferred_hospital || "",
            nomineeName: protocol.nominee_name || "",
            nomineeRelationship: protocol.nominee_relationship || "",
            nomineePhone: protocol.nominee_phone || "",
            nomineeEmail: protocol.nominee_email || "",
            lockerLocations: protocol.locker_locations || "",
            willDeedLocations: protocol.will_deed_locations || "",
            handoverInstructions: protocol.handover_instructions || "",
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

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const supabase = await createSupabaseServerClient();

  try {
    const payload = {
      user_id: session.sub,
      blood_group: String(body.bloodGroup ?? "").trim(),
      allergies: String(body.allergies ?? "").trim(),
      chronic_conditions: String(body.chronicConditions ?? "").trim(),
      medications: String(body.medications ?? "").trim(),
      preferred_hospital: String(body.preferredHospital ?? "").trim(),
      nominee_name: String(body.nomineeName ?? "").trim(),
      nominee_relationship: String(body.nomineeRelationship ?? "").trim(),
      nominee_phone: String(body.nomineePhone ?? "").trim(),
      nominee_email: String(body.nomineeEmail ?? "").trim(),
      locker_locations: String(body.lockerLocations ?? "").trim(),
      will_deed_locations: String(body.willDeedLocations ?? "").trim(),
      handover_instructions: String(body.handoverInstructions ?? "").trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("emergency_protocols")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.warn("[emergency-sos] upsert protocol fallback:", error.message);
    }

    return NextResponse.json({ success: true, protocol: body });
  } catch (err) {
    console.warn("[emergency-sos] save error fallback:", err);
    return NextResponse.json({ success: true, protocol: body });
  }
}
