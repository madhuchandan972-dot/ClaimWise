// ============================================================
// ClaimWise — public share-link resolution (server-only)
//
// Validates a viewer's token WITHOUT any user session:
//   1. Looks the token up via the service-role client (the only
//      path that can read share_links besides the owner).
//   2. Rejects revoked or expired links outright.
//   3. Returns the owner id + in-scope document ids so byte
//      routes can ONLY ever reach documents this link covers.
//
// Every result is wrapped in a discriminated outcome the routes
// map to honest error pages — never a stack trace, never silent.
// ============================================================

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Document as VaultDocument } from "@/lib/types";

export type ShareScope = "document" | "vault";

export interface ResolvedShare {
  id: string;
  token: string;
  scope: ShareScope;
  userId: string;
  documentId: string | null;
  expiresAt: string;
  viewCount: number;
  createdAt: string;
  label: string | null;
}

export type ShareResolution =
  | { ok: true; share: ResolvedShare }
  | { ok: false; reason: "missing" | "expired" | "revoked" | "unconfigured" };

export async function resolveShare(token: string): Promise<ShareResolution> {
  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return { ok: false, reason: "unconfigured" };
  }

  const { data: row, error } = await supabase
    .from("share_links")
    .select("id, token, scope, user_id, document_id, label, expires_at, view_count, created_at, revoked")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("[shares:resolve] failed:", error.message);
    return { ok: false, reason: "missing" };
  }
  if (!row) return { ok: false, reason: "missing" };
  if (row.revoked) return { ok: false, reason: "revoked" };
  if (new Date(row.expires_at).getTime() <= Date.now()) return { ok: false, reason: "expired" };

  return {
    ok: true,
    share: {
      id: row.id,
      token: row.token,
      scope: (row.scope === "vault" ? "vault" : "document") as ShareScope,
      userId: row.user_id,
      documentId: row.document_id,
      expiresAt: row.expires_at,
      viewCount: row.view_count,
      createdAt: row.created_at,
      label: row.label,
    },
  };
}

/** All documents the share covers (metadata only). */
export async function documentsForShare(share: ResolvedShare): Promise<VaultDocument[]> {
  const supabase = createSupabaseAdminClient();

  const query = supabase
    .from("documents")
    .select("id, name, type, file_type, size, uploaded_at, status, original_name")
    .order("uploaded_at", { ascending: false });

  const { data, error } =
    share.scope === "vault"
      ? await query.eq("user_id", share.userId)
      : await query.eq("id", share.documentId ?? "");

  if (error) {
    console.error("[shares:docs] failed:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    userId: share.userId,
    name: r.name ?? "",
    type: (r.type ?? "Other") as VaultDocument["type"],
    fileType: (r.file_type ?? "pdf") as VaultDocument["fileType"],
    size: Number(r.size ?? 0),
    uploadedAt: r.uploaded_at ?? "",
    status: r.status ?? "",
    description: "",
    originalName: r.original_name ?? "",
  }));
}

/** Owner display name for the public page header. */
export async function ownerName(userId: string): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .maybeSingle();
  const full = profile?.name ?? "";
  return full.split(" ")[0] || "a family";
}

/** Bump the transparency counter once per page load. */
export async function noteShareView(share: ResolvedShare): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("share_links")
    .update({ view_count: share.viewCount + 1, last_viewed_at: new Date().toISOString() })
    .eq("id", share.id);
}
