// ============================================================
// ClaimWise — /api/shares
//
// GET  : the owner's share links (newest first) with computed
//        status (active / revoked / expired).
// POST : create a new link. Body:
//          { scope: 'document'|'vault', documentId?, expiresInDays }
//        Expiry is clamped to 1…90 days. The token is 32 bytes of
//        crypto randomness (base64url) — the capability itself.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSessionFromRequest } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_DAYS = 90;

function describe(row: ShareRow): ShareView {
  const expired = new Date(row.expires_at).getTime() <= Date.now();
  return {
    id: row.id,
    scope: row.scope,
    documentId: row.document_id,
    token: row.token,
    label: row.label,
    expiresAt: row.expires_at,
    viewCount: row.view_count,
    createdAt: row.created_at,
    status: row.revoked ? "revoked" : expired ? "expired" : "active",
  };
}

type ShareRow = {
  id: string;
  scope: string;
  document_id: string | null;
  token: string;
  label: string | null;
  expires_at: string;
  view_count: number;
  created_at: string;
  revoked: boolean;
};

export interface ShareView {
  id: string;
  scope: string;
  documentId: string | null;
  token: string;
  label: string | null;
  expiresAt: string;
  viewCount: number;
  createdAt: string;
  status: "active" | "revoked" | "expired";
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("share_links")
    .select("id, scope, document_id, token, label, expires_at, view_count, created_at, revoked")
    .eq("user_id", session.sub)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[shares:list] failed:", error.message);
    return NextResponse.json({ success: false, error: "Could not load your share links." }, { status: 500 });
  }

  return NextResponse.json({ success: true, shares: (data ?? []).map(describe) });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { scope?: string; documentId?: string; expiresInDays?: number; label?: string }
    | null;

  const scope = body?.scope === "vault" ? "vault" : "document";
  const days = Math.min(Math.max(Math.floor(Number(body?.expiresInDays ?? 7) || 7), 1), MAX_DAYS);
  const label = String(body?.label ?? "").slice(0, 80) || null;

  const supabase = await createSupabaseServerClient();

  let documentId: string | null = null;
  if (scope === "document") {
    documentId = String(body?.documentId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(documentId)) {
      return NextResponse.json({ success: false, error: "Choose which document to share." }, { status: 400 });
    }
    // Ownership check — never allow linking to somebody else's doc.
    const { data: owned } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .eq("user_id", session.sub)
      .maybeSingle();
    if (!owned) {
      return NextResponse.json({ success: false, error: "That document is not in your vault." }, { status: 404 });
    }
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const insert = {
    user_id: session.sub,
    token,
    scope,
    document_id: documentId,
    expires_at: expiresAt,
    label,
  };
  const { data: row, error } = await supabase
    .from("share_links")
    .insert(insert)
    .select("id, scope, document_id, token, label, expires_at, view_count, created_at, revoked")
    .single();

  if (error || !row) {
    console.error("[shares:create] failed:", error?.message);
    return NextResponse.json({ success: false, error: "Could not create the share link." }, { status: 500 });
  }

  return NextResponse.json({ success: true, share: describe(row as ShareRow) });
}
