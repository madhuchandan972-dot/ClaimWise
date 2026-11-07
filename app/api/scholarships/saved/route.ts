// ============================================================
// ClaimWise — GET/POST/DELETE /api/scholarships/saved
// Saves are tied to the authenticated user by the session id (never
// by a client-supplied user id) and protected by RLS.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getScholarship, listScholarships } from "@/lib/store";
import {
  listSavedScholarships,
  saveScholarship,
  unsaveScholarship,
} from "@/lib/vault";
import { z } from "zod";

const saveSchema = z.object({ scholarshipId: z.string().trim().min(1).max(120) });

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  try {
    const [saved, catalogue] = await Promise.all([
      listSavedScholarships(session.sub),
      listScholarships(),
    ]);
    const byId = new Map(catalogue.map((s) => [s.id, s]));
    return NextResponse.json({
      success: true,
      saved: saved.map((entry) => ({
        ...entry,
        scholarship: byId.get(entry.scholarshipId) ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not load saved scholarships." },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Choose a valid scholarship to save." },
      { status: 400 }
    );
  }

  try {
    const scholarship = await getScholarship(parsed.data.scholarshipId);
    if (!scholarship) {
      return NextResponse.json(
        { success: false, error: "Scholarship not found." },
        { status: 404 }
      );
    }
    await saveScholarship(session.sub, scholarship.id);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not save the scholarship." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const scholarshipId = new URL(request.url).searchParams.get("scholarshipId") ?? "";
  if (!scholarshipId) {
    return NextResponse.json(
      { success: false, error: "scholarshipId is required." },
      { status: 400 }
    );
  }

  try {
    await unsaveScholarship(session.sub, scholarshipId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not remove the scholarship." },
      { status: 500 }
    );
  }
}
