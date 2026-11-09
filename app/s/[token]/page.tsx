// ============================================================
// ClaimWise — public page /s/[token]
//
// Anyone with the link (and NOTHING else) can view the shared
// documents until the link expires or the owner revokes it.
// There is no session here: the token itself is the capability,
// and every access is counted for the owner's transparency.
//
// Server component: the share is resolved and validated before
// any render, so an invalid URL gets an honest dead-end page.
// ============================================================

import Link from "next/link";
import { Clock, FileText, ShieldCheck, Eye, Ban } from "lucide-react";
import { documentsForShare, noteShareView, ownerName, resolveShare } from "@/lib/shares";
import { formatFileSize } from "@/lib/utils";

export const dynamic = "force-dynamic";

function DeadEnd({
  icon,
  title,
  body,
}: {
  icon: "clock" | "ban" | "question";
  title: string;
  body: string;
}) {
  const Icon = icon === "clock" ? Clock : icon === "ban" ? Ban : ShieldCheck;
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
          <Icon className="h-7 w-7 text-gray-400" />
        </span>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">{body}</p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-blue-700 hover:underline">
          Go to ClaimWise
        </Link>
      </div>
    </main>
  );
}

function formatExpiry(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const base64url = /^[A-Za-z0-9_-]{20,80}$/;
  if (!base64url.test(token)) {
    return <DeadEnd icon="question" title="This link doesn't look right" body="Share links come from the ClaimWise app — check the link you received." />;
  }

  const resolved = await resolveShare(token);
  if (!resolved.ok) {
    const copy =
      resolved.reason === "expired"
        ? { icon: "clock" as const, title: "This link has expired", body: "The owner set a sharing window that has now passed. Ask them for a fresh link." }
        : resolved.reason === "revoked"
          ? { icon: "ban" as const, title: "Sharing was turned off", body: "The owner revoked this link. Nothing is available here anymore." }
          : resolved.reason === "unconfigured"
            ? { icon: "question" as const, title: "Sharing isn't set up yet", body: "The ClaimWise deployment doesn't have public sharing switched on." }
            : { icon: "question" as const, title: "Link not found", body: "This share link doesn't exist or was already removed." };
    return <DeadEnd icon={copy.icon} title={copy.title} body={copy.body} />;
  }

  const share = resolved.share;
  const docs = await documentsForShare(share);
  const name = await ownerName(share.userId);
  await noteShareView(share);

  if (docs.length === 0) {
    return (
      <DeadEnd
        icon="question"
        title="Nothing shared here yet"
        body="The link is valid but the owner's vault has no documents under this share right now."
      />
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Shared from ClaimWise</p>
          <h1 className="mt-1 text-xl font-bold text-gray-900">
            {share.scope === "vault" ? `${name}'s document vault` : share.label || docs[0]?.name || "A shared document"}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Works until {formatExpiry(share.expiresAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {share.viewCount + 1} view{share.viewCount + 1 === 1 ? "" : "s"}
            </span>
          </p>
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50/60 px-3 py-2.5 text-[11px] leading-relaxed text-blue-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
            Only this link can see these files — nothing else from the vault is exposed, and the owner can cut access at any moment.
          </p>
        </div>

        {/* Documents */}
        <ul className="space-y-3">
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <FileText className="h-5 w-5 text-blue-700" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{doc.name}</p>
                <p className="text-xs text-gray-500">
                  {doc.type} · {formatFileSize(doc.size)} · uploaded {new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <a
                href={`/api/shares/view/${share.token}/file?docId=${doc.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
              >
                Open
              </a>
            </li>
          ))}
        </ul>

        <p className="pb-8 text-center text-[11px] text-gray-400">
          Served by <Link href="/" className="font-semibold text-gray-500 hover:underline">ClaimWise</Link> — a family vault for every document that matters.
        </p>
      </div>
    </main>
  );
}
