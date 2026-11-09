// ============================================================
// ClaimWise — GET /api/emergency-card
//
// Assembles the user's OWN verified data for the printable
// Emergency Information Card: identity, emergency contacts,
// insurance policies, property locations and financial
// obligations. Read-only, RLS-scoped, nothing stored.
// Family members do NOT get this endpoint — it is owner-only
// by design (a printed card must be handed over by the owner).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getWorkspace } from "@/lib/store";
import {
  listEmergencyContacts,
  listFinancialRecords,
  listInsuranceRecords,
  listProperties,
} from "@/lib/vault";

const DATE_FMT = (iso?: string) => {
  if (!iso) return undefined;
  try {
    return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  try {
    const workspace = await getWorkspace(session.sub, session.email, session.name);

    const [contacts, insurance, properties, financial] = await Promise.all([
      listEmergencyContacts(session.sub),
      listInsuranceRecords(session.sub),
      listProperties(session.sub),
      listFinancialRecords(session.sub),
    ]);

    // Age from DOB (year precision is enough on a paper card).
    let age: number | undefined;
    const dob = workspace.profile.dob?.slice(0, 10);
    if (dob && !Number.isNaN(new Date(dob).getTime())) {
      const d = new Date(dob);
      age = new Date().getFullYear() - d.getFullYear();
      const beforeBirthday =
        new Date().getMonth() < d.getMonth() ||
        (new Date().getMonth() === d.getMonth() && new Date().getDate() < d.getDate());
      if (beforeBirthday) age -= 1;
      if (age < 0 || age > 130) age = undefined;
    }

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      person: {
        name: workspace.profile.name,
        dob: DATE_FMT(dob),
        age,
        gender: workspace.profile.gender,
        phone: workspace.profile.phone,
        state: workspace.profile.state,
        district: workspace.profile.district,
      },
      contacts: contacts.map((c) => ({
        name: c.name,
        relationship: c.relationship,
        phone: c.phone,
        email: c.email || undefined,
      })),
      insurance: insurance.map((i) => ({
        label: [i.provider, i.policyType].filter(Boolean).join(" — "),
        policyNumber: i.policyNumber,
        policyholder: i.policyholderName,
        expiry: DATE_FMT(i.expiryDate),
      })),
      properties: properties.map((p) => ({
        label: p.propertyName,
        type: p.propertyType,
        location: p.location,
        registration: p.registrationNumber,
      })),
      obligations: financial
        .filter((f) => f.recordType === "loan" || f.recordType === "debt" || f.recordType === "obligation")
        .map((f) => ({
          label: [f.institution, f.description].filter(Boolean).join(" — ").slice(0, 120),
          outstanding: f.outstandingAmount !== undefined ? `Rs ${f.outstandingAmount.toLocaleString("en-IN")}` : undefined,
          due: DATE_FMT(f.dueDate),
        })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not assemble the emergency card." },
      { status: 503 }
    );
  }
}
