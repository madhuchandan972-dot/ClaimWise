'use client';

// ============================================================
// ClaimWise — DigiLocker pane (Documents page)
//
// Lets the user connect THEIR OWN official DigiLocker account
// (Aadhaar-linked, via the government's OAuth page) and pull
// their government-issued documents straight from the
// government's server into the private vault.
//
// Shows an honest "not configured" state until the deployment
// has partner credentials from https://partners.digilocker.gov.in
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Link as LinkIcon,
  RefreshCw,
  DownloadCloud,
  XCircle,
  FileCheck2,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import type { DocumentType } from '@/lib/types';
import { DOCUMENT_CATEGORIES } from '@/lib/categories';
import { formatFileSize } from '@/lib/utils';

interface DlgFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

interface FilesResponse {
  success: boolean;
  configured: boolean;
  linked: boolean;
  expired?: boolean;
  files?: DlgFile[];
  error?: string;
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_CATEGORIES.map((c) => [c, c])
);

export default function DigilockerPane({ onSaved, startupNotice }: { onSaved: () => void; startupNotice?: string }) {
  const [data, setData] = useState<FilesResponse | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(startupNotice ?? '');
  const [categories, setCategories] = useState<Record<string, DocumentType>>({});

  const load = useCallback(async () => {
    setLoadError('');
    setNotice('');
    try {
      const r = await fetch('/api/digilocker/files');
      const json = await r.json();
      if (!r.ok || !json.success) {
        setLoadError(json.error ?? 'Could not reach DigiLocker.');
        return;
      }
      setData(json as FilesResponse);
      if (json.expired) setNotice('Your DigiLocker connection expired. Connect again to continue.');
    } catch {
      setLoadError('Network error while contacting DigiLocker.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function disconnect() {
    setBusy('disconnect');
    try {
      await fetch('/api/digilocker/files', { method: 'DELETE' });
      setData({ success: true, configured: true, linked: false, files: [] });
    } finally {
      setBusy('');
    }
  }

  async function save(file: DlgFile) {
    const category = categories[file.id] ?? ('Other' as DocumentType);
    setBusy(file.id);
    setNotice('');
    try {
      const r = await fetch('/api/digilocker/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, name: file.name, category }),
      });
      const json = await r.json();
      if (!r.ok || !json.success) {
        setLoadError(json.error ?? 'Could not fetch this document.');
        return;
      }
      setNotice(`Saved "${file.name}" to your vault.`);
      onSaved();
    } catch {
      setLoadError('Network error while fetching from DigiLocker.');
    } finally {
      setBusy('');
    }
  }

  if (data === null) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-gray-100 bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
      </div>
    );
  }

  // ── Not configured on this deployment ──
  if (!data.configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-amber-700" />
          <h2 className="text-sm font-bold text-amber-900">DigiLocker is not yet enabled</h2>
        </div>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-amber-800">
          Fetching documents automatically requires official DigiLocker partner credentials from
          <a
            href="https://partners.digilocker.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 font-semibold underline"
          >
            partners.digilocker.gov.in
          </a>
          . Once approved, set <code className="rounded bg-white/60 px-1">DIGILOCKER_CLIENT_ID</code> and{' '}
          <code className="rounded bg-white/60 px-1">DIGILOCKER_CLIENT_SECRET</code> in the deployment and
          register the redirect URL <code className="rounded bg-white/60 px-1">/api/digilocker/callback</code>.
        </p>
        <p className="mt-3 text-[11px] leading-relaxed text-amber-700">
          Until then, you can still export documents to your device from your own digilocker.gov.in account and
          upload them via the manual vault. Everything stays in your control either way.
        </p>
      </div>
    );
  }

  // ── Connected or connectable ──
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          <div>
            <h2 className="text-sm font-bold text-emerald-900">DigiLocker — official government fetch</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-emerald-800">
              You authorise <b>your own</b> Aadhaar-linked DigiLocker account on the government&apos;s site. The
              connected session lasts about an hour and lives only in an encrypted, HttpOnly cookie — never in
              our database. Fetched files are stored privately like any manual upload.
            </p>
          </div>
        </div>
        {data.linked ? (
          <button onClick={disconnect} disabled={!!busy} className="btn-secondary !py-2 text-xs">
            {busy === 'disconnect' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Disconnect
          </button>
        ) : (
          <a href="/api/digilocker/start" className="btn-primary !py-2 text-xs whitespace-nowrap">
            <LinkIcon className="h-3.5 w-3.5" /> Link DigiLocker account
          </a>
        )}
      </div>

      {(notice || loadError) && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 ${
            loadError ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          {loadError ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          ) : (
            <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <p className={`text-xs ${loadError ? 'text-red-700' : 'text-emerald-800'}`}>
            {loadError || notice}
          </p>
          {loadError && <button onClick={load} className="ml-auto text-[11px] font-semibold text-blue-700 underline">Retry</button>}
        </div>
      )}

      {data.linked && (data.files ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center">
          <DownloadCloud className="h-9 w-9 text-gray-300" />
          <p className="mt-3 text-sm font-semibold text-gray-700">No documents in your DigiLocker drive yet</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-gray-500">
            Documents issued to you by government departments appear here automatically. Issued document PDFs
            sometimes reach the drive a little while after issuance.
          </p>
          <button onClick={load} className="btn-secondary mt-4 !py-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh list
          </button>
        </div>
      )}

      {data.linked && (data.files ?? []).length > 0 && (
        <div className="space-y-2">
          {(data.files ?? []).map((file) => (
            <div
              key={file.id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{file.name}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  PDF · {formatFileSize(file.size)} · from digilocker.gov.in
                </p>
              </div>
              <select
                value={categories[file.id] ?? 'Other'}
                onChange={(e) => setCategories((c) => ({ ...c, [file.id]: e.target.value as DocumentType }))}
                className="input-field sm:w-56"
                aria-label={`Category for ${file.name}`}
              >
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
              <button onClick={() => save(file)} disabled={!!busy} className="btn-primary !py-2 text-xs sm:w-44">
                {busy === file.id ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching…</>
                ) : (
                  <><DownloadCloud className="h-3.5 w-3.5" /> Save to vault</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
