// ============================================================
// ClaimWise — GET /api/shares/view/[token]/file?docId=…
//
// Streams one shared document's bytes to an anonymous visitor —
// the ONLY public file path in the app. Safety chain, in order:
//   1. Token must resolve to a live share (not revoked/expired).
//   2. The requested docId must be exactly the shared document
//      (document scope) or any doc of the owner (vault scope).
//   3. Bytes come straight from the private storage bucket via
//      the elevated client — a tampered docId from another user's
//      vault resolves to nothing.
//   4. no-store + nosniff; counts one view per successful serve.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveShare } from "@/lib/shares";

function deny(status: number, message: string) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const docId = request.nextUrl.searchParams.get("docId") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(docId)) return deny(400, "Choose a document to open.");

  const resolved = await resolveShare(token);
  if (!resolved.ok) {
    if (resolved.reason === "unconfigured") {
      return deny(503, "Share viewing is not configured on this deployment.");
    }
    return deny(410, "This share link is no longer available.");
  }
  const share = resolved.share;

  const inScope =
    share.scope === "document"
      ? share.documentId === docId
      : true;
  if (!inScope) return deny(403, "That document is not part of this share.");

  const supabase = createSupabaseAdminClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("id, user_id, name, file_type")
    .eq("id", docId)
    .eq("user_id", share.userId) // hard rule: the doc MUST belong to the link owner
    .maybeSingle();
  if (!doc) return deny(404, "That document is not part of this share.");

  const { data: blob, error } = await supabase.storage
    .from("documents")
    .download(`${share.userId}/${docId}`);
  if (error || !blob) {
    console.error("[shares:file] download failed:", error?.message ?? "no blob");
    return deny(404, "The stored file could not be loaded.");
  }

  // Transparency: count served bytes as a view too.
  await supabase
    .from("share_links")
    .update({ view_count: (share.viewCount ?? 0) + 1, last_viewed_at: new Date().toISOString() })
    .eq("id", share.id);

  const mime =
    doc.file_type === "png" ? "image/png" : doc.file_type === "jpeg" || doc.file_type === "jpg" ? "image/jpeg" : "application/pdf";
  const filename = (doc.name ?? "document").replace(/[^\w.\- ]+/g, "_").slice(0, 120);

  return new NextResponse(new Uint8Array(await blob.arrayBuffer()), {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
      "Content-Length": String(blob.size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
