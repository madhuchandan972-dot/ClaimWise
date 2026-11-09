// ============================================================
// ClaimWise — /api/record-lookup
//
// Saved "official record references": when a user looks up a
// government document by its RD/registration number, ClaimWise
// hands back a reference card pointing at the official portal.
// This route stores/removes those references in the vault.
//
// No scraping or proxying happens anywhere: the portal URL is
// validated against the curated registry (lib/record-lookup.ts)
// and served as a plain link the user opens themselves.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  addRecordReference,
  deleteRecordReference,
  getWorkspace,
  listRecordReferences,
} from "@/lib/store";
import {
  buildReference,
  cleanValues,
  getLookupEntry,
  getState,
  valuesComplete,
} from "@/lib/record-lookup";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  await getWorkspace(session.sub, session.email, session.name);
  try {
    const references = await listRecordReferences(session.sub);
    return NextResponse.json({ success: true, references });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Could not load your saved lookups." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const entryId = String(body?.entryId ?? "");
    const rawValues = (body?.values ?? {}) as Record<string, unknown>;

    const entry = getLookupEntry(entryId);
    const state = getState(entry?.stateCode ?? "");
    if (!entry || !state) {
      return NextResponse.json(
        { success: false, error: "Unknown record type. Pick a state and a document type." },
        { status: 400 }
      );
    }

    const values = cleanValues(entry, rawValues);
    if (!valuesComplete(entry, values)) {
      return NextResponse.json({ success: false, error: "Fill in the required fields first." }, { status: 400 });
    }

    const ref = buildReference(entryId, values);
    if (!ref) {
      return NextResponse.json({ success: false, error: "This lookup could not be validated." }, { status: 400 });
    }

    const name = `${ref.kindLabel} · ${values.number ?? ref.stateName} (${ref.stateName})`;
    const saved = await addRecordReference(session.sub, {
      name,
      stateCode: state.code,
      entryId: entry.id,
      values,
    });

    if ("error" in saved) {
      return NextResponse.json({ success: false, error: saved.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, reference: saved });
  } catch {
    return NextResponse.json({ success: false, error: "Network error while saving." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const refId = request.nextUrl.searchParams.get("id") ?? "";
  if (!refId) {
    return NextResponse.json({ success: false, error: "Missing lookup id." }, { status: 400 });
  }

  try {
    await deleteRecordReference(refId, session.sub);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Could not delete the lookup." },
      { status: 500 }
    );
  }
}
