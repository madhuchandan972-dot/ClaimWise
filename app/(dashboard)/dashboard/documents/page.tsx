'use client';

import { useEffect, useState, useCallback, ChangeEvent, useRef } from 'react';
import {
  UploadCloud,
  Search,
  FileText,
  Trash2,
  Eye,
  Download,
  Loader2,
  AlertTriangle,
  X,
  Lock,
  FileQuestion,
  FolderPlus,
  Globe,
  ExternalLink,
  ShieldCheck,
  BookmarkPlus,
  DownloadCloud,
} from 'lucide-react';
import DigilockerPane from '@/components/dashboard/DigilockerPane';
import type { Document as VaultDocument, DocumentType, RecordReference } from '@/lib/types';
import { formatFileSize, getDocumentIcon } from '@/lib/utils';
import { documentLabel } from '@/lib/eligibility';
import { RECORD_STATES, getLookupEntry, buildReference, fieldsFor, kindLabel, type BuiltReference } from '@/lib/record-lookup';
import { daysUntil } from '@/lib/dates';

const CATEGORIES: { value: DocumentType; label: string }[] = [
  { value: 'AadhaarCard', label: 'Aadhaar Document' },
  { value: 'PANCard', label: 'PAN Document' },
  { value: 'PropertyDocument', label: 'Property Document' },
  { value: 'InsuranceDocument', label: 'Insurance Document' },
  { value: 'BankDocument', label: 'Bank Document' },
  { value: 'Other', label: 'Other Important Document' },
  { value: 'IncomeCertificate', label: 'Income Certificate' },
  { value: 'CasteCertificate', label: 'Caste Certificate' },
  { value: 'MarksCard', label: 'Marks Card' },
  { value: 'TransferCertificate', label: 'Transfer Certificate' },
];

const MAX_MB = 5;
const ACCEPT = '.pdf,.jpg,.jpeg,.png';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<VaultDocument[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [uploadType, setUploadType] = useState<DocumentType>('AadhaarCard');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VaultDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Official record lookup (RD number → government portal reference)
  const [tab, setTab] = useState<'uploaded' | 'records' | 'digilocker'>('uploaded');
  const [refs, setRefs] = useState<RecordReference[] | null>(null);
  const [refsError, setRefsError] = useState('');
  const [lookupStateCode, setLookupStateCode] = useState('');
  const [lookupEntryId, setLookupEntryId] = useState('');
  const [lookupValues, setLookupValues] = useState<Record<string, string>>({});
  const [built, setBuilt] = useState<BuiltReference | null>(null);
  const [savingRef, setSavingRef] = useState(false);
  const [refDelete, setRefDelete] = useState<RecordReference | null>(null);
  const [dlgNotice, setDlgNotice] = useState('');

  const loadDocs = useCallback(async () => {    try {
      const r = await fetch('/api/documents');
      const data = await r.json();
      if (!r.ok || !data.success) {
        setLoadError(data.error ?? 'Could not load your documents.');
        setDocuments([]);
        return;
      }
      setDocuments(data.documents as VaultDocument[]);
      setLoadError('');
    } catch {
      setLoadError('Network error while loading documents.');
      setDocuments([]);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);
  useEffect(() => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // DigiLocker OAuth landing: activate the tab and surface callback messages.
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const err = p.get('dlgError');
      const refetch = p.get('dlgRefetch');
      if (err || refetch) {
        setDlgNotice(err ? decodeURIComponent(err) : '');
        setTab('digilocker');
        window.history.replaceState({}, '', '/dashboard/documents#digilocker');
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadRefs = useCallback(async () => {
    try {
      const r = await fetch('/api/record-lookup');
      const data = await r.json();
      if (!r.ok || !data.success) {
        setRefsError(data.error ?? 'Could not load your saved lookups.');
        setRefs([]);
        return;
      }
      setRefs(data.references as RecordReference[]);
      setRefsError('');
    } catch {
      setRefsError('Network error while loading saved lookups.');
      setRefs([]);
    }
  }, []);

  useEffect(() => {
    if (tab === 'records' && refs === null) loadRefs();
  }, [tab, refs, loadRefs]);

  const lookupEntry = lookupEntryId ? getLookupEntry(lookupEntryId) : undefined;
  const lookupFields = lookupEntry ? fieldsFor(lookupEntry) : [];

  function chooseState(code: string) {
    setLookupStateCode(code);
    setLookupEntryId('');
    setLookupValues({});
    setBuilt(null);
  }
  function chooseEntry(id: string) {
    setLookupEntryId(id);
    setLookupValues({});
    setBuilt(null);
  }
  function handleGetReference(e: React.FormEvent) {
    e.preventDefault();
    setRefsError('');
    if (!lookupEntry) return;
    const ref = buildReference(lookupEntry.id, lookupValues);
    if (!ref) {
      setRefsError(`Fill in the ${lookupFields.filter((f) => !f.optional).map((f) => f.label.toLowerCase()).join(', ')} first.`);
      return;
    }
    setBuilt(ref);
  }

  async function handleSaveRef() {
    if (!lookupEntry) { setRefsError('Pick a record type first.'); return; }
    const ref = buildReference(lookupEntry.id, lookupValues);
    if (!ref) { setRefsError(`Fill in the ${lookupFields.filter((f) => !f.optional).map((f) => f.label.toLowerCase()).join(', ')} first.`); return; }
    setSavingRef(true);
    setRefsError('');
    try {
      const r = await fetch('/api/record-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: lookupEntry.id, values: lookupValues }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) {
        setRefsError(data.error ?? 'Could not save this lookup.');
        return;
      }
      setRefs((cur) => [data.reference as RecordReference, ...(cur ?? [])]);
      await loadRefs();
    } catch {
      setRefsError('Network error while saving. Please try again.');
    } finally {
      setSavingRef(false);
    }
  }
  async function handleDeleteRef() {
    if (!refDelete) return;
    setSavingRef(true);
    try {
      const r = await fetch(`/api/record-lookup?id=${encodeURIComponent(refDelete.id)}`, { method: 'DELETE' });
      const data = await r.json();
      if (!r.ok || !data.success) {
        setRefsError(data.error ?? 'Could not delete the lookup.');
        return;
      }
      setRefDelete(null);
      await loadRefs();
    } finally {
      setSavingRef(false);
    }
  }

  function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setUploadError('');
    if (!f) return setUploadFile(null);
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) {
      setUploadError('Only PDF, JPG, JPEG and PNG files are allowed.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setUploadError(`File is larger than ${MAX_MB} MB.`);
      return;
    }
    setUploadFile(f);
  }

  function resetUpload() {
    setTitle('');
    setUploadType('AadhaarCard');
    setExpiryDate('');
    setDescription('');
    setUploadFile(null);
    setUploadError('');
    if (fileInput.current) fileInput.current.value = '';
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setUploadError('Add a title for this document.'); return; }
    if (!uploadFile) { setUploadError('Choose a file to upload.'); return; }

    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('category', uploadType);
      fd.append('description', description.trim());
      if (expiryDate) fd.append('expiryDate', expiryDate);
      fd.append('file', uploadFile);
      const r = await fetch('/api/documents', { method: 'POST', body: fd });
      const data = await r.json();
      if (!r.ok || !data.success) {
        setUploadError(data.error ?? 'Upload failed.');
        return;
      }
      setUploadOpen(false);
      resetUpload();
      await loadDocs();
    } catch {
      setUploadError('Network error during upload. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function openPreview(doc: VaultDocument) {
    setPreviewDoc(doc);
    setPreviewError('');
    setPreviewLoading(true);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    try {
      const r = await fetch(`/api/documents/${doc.id}/file`);
      if (!r.ok) {
        const data = await r.json().catch(() => null);
        setPreviewError(data?.error ?? 'The stored file could not be loaded.');
        return;
      }
      setPreviewUrl(URL.createObjectURL(await r.blob()));
    } catch {
      setPreviewError('Could not load the file preview.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/documents/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await r.json();
      if (!r.ok || !data.success) {
        setUploadError(data.error ?? 'Could not delete the document.');
        return;
      }
      if (previewDoc?.id === deleteTarget.id) {
        setPreviewDoc(null);
        setPreviewUrl(null);
      }
      setDeleteTarget(null);
      await loadDocs();
    } finally {
      setDeleting(false);
    }
  }

  const filtered = (documents ?? []).filter((d) => {
    const q = search.trim().toLowerCase();
    const matchQ = q
      ? d.name.toLowerCase().includes(q) ||
        documentLabel(d.type).toLowerCase().includes(q) ||
        (d.description ?? '').toLowerCase().includes(q)
      : true;
    return matchQ && (categoryFilter ? d.type === categoryFilter : true);
  });

  const stateEntry = lookupStateCode ? RECORD_STATES.find((s) => s.code === lookupStateCode) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Documents</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Store important family documents privately, or find official documents by their registration (RD) number.
          </p>
        </div>
        {tab === 'uploaded' && (
          <button onClick={() => { setUploadOpen(true); setUploadError(''); }} className="btn-primary w-full sm:w-auto">
            <UploadCloud className="h-4 w-4" /> Upload Document
          </button>
        )}
      </div>

      {/* Vault sections */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('uploaded')}
          aria-pressed={tab === 'uploaded'}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            tab === 'uploaded' ? 'bg-blue-700 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700'
          }`}
        >
          <FileText className="h-4 w-4" /> Uploaded files
        </button>
        <button
          onClick={() => setTab('records')}
          aria-pressed={tab === 'records'}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            tab === 'records' ? 'bg-blue-700 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700'
          }`}
        >
          <Globe className="h-4 w-4" /> Official records (RD lookup)
        </button>
        <button
          onClick={() => setTab('digilocker')}
          aria-pressed={tab === 'digilocker'}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            tab === 'digilocker' ? 'bg-emerald-700 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
          }`}
        >
          <DownloadCloud className="h-4 w-4" /> DigiLocker
        </button>
      </div>

      {tab === 'uploaded' ? (
        <>
      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
        <p className="text-xs leading-relaxed text-blue-800">
          PDF, JPG, JPEG and PNG up to {MAX_MB} MB. File contents are checked on the server, and documents
          are served only to you or a family member you have explicitly authorised.
        </p>
      </div>

      {loadError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{loadError}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, category or description…"
            className="input-field pl-10"
            aria-label="Search documents"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field sm:w-60"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {documents === null ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <FolderPlus className="h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-semibold text-gray-700">
            {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {documents.length === 0 ? 'Upload your first document to start your vault.' : 'Try a different search or category.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doc) => (
            <article key={doc.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                  {getDocumentIcon(doc.type)}
                </span>
                <span className="badge bg-gray-100 text-gray-600">{documentLabel(doc.type)}</span>
              </div>
              <h2 className="mt-4 break-words text-sm font-bold text-gray-900">{doc.name}</h2>
              {doc.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{doc.description}</p>}
              <p className="mt-3 text-[11px] text-gray-400">
                {doc.fileType.toUpperCase()} · {formatFileSize(doc.size)} ·{' '}
                {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {doc.expiryDate && <DocExpiryBadge iso={doc.expiryDate} />}
              <div className="mt-4 flex gap-2 border-t border-gray-50 pt-3">
                <button
                  onClick={() => openPreview(doc)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-700"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <a
                  href={`/api/documents/${doc.id}/file?download=1`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-700"
                  aria-label={`Download ${doc.name}`}
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => setDeleteTarget(doc)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
                  aria-label={`Delete ${doc.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      </>
      ) : tab === 'digilocker' ? (
        <DigilockerPane onSaved={loadDocs} startupNotice={dlgNotice} />
      ) : (
        <>
      <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <p className="text-xs leading-relaxed text-emerald-800">
          No scanning needed. Enter your registration (RD) number and we point you at the official government portal so you
          can download the document directly from the government&apos;s own server. ClaimWise never hosts or proxies these files.
        </p>
      </div>

      {refsError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{refsError}</p>
        </div>
      )}

      {/* Lookup form */}
      <form onSubmit={handleGetReference} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-700" />
          <h2 className="text-sm font-bold text-gray-900">Look up an official document</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rdState" className="label">State</label>
            <select
              id="rdState"
              value={lookupStateCode}
              onChange={(e) => chooseState(e.target.value)}
              className="input-field"
            >
              <option value="">Select your state…</option>
              {RECORD_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rdKind" className="label">Record type</label>
            <select
              id="rdKind"
              value={lookupEntryId}
              onChange={(e) => chooseEntry(e.target.value)}
              className="input-field"
              disabled={!stateEntry}
            >
              <option value="">{stateEntry ? 'Select a record type…' : 'Choose a state first'}</option>
              {stateEntry?.lookups.map((l) => <option key={l.id} value={l.id}>{kindLabel(l.kind)}</option>)}
            </select>
          </div>
          {lookupEntry && lookupFields.map((f) => (
            <div key={f.key}>
              <label htmlFor={`rdField-${f.key}`} className="label">
                {f.label} {!f.optional && <span className="text-red-500">*</span>}
                {f.optional && <span className="font-normal text-gray-400"> (optional)</span>}
              </label>
              <input
                id={`rdField-${f.key}`}
                value={lookupValues[f.key] ?? ''}
                onChange={(e) => setLookupValues((v) => ({ ...v, [f.key]: e.target.value }))}
                maxLength={80}
                placeholder={f.placeholder}
                className="input-field"
              />
            </div>
          ))}
        </div>
        <button type="submit" className="btn-primary mt-4">
          <Globe className="h-4 w-4" /> Get reference
        </button>
      </form>

      {/* Built reference card */}
      {built && (
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">{built.kindLabel}</h3>
                <span className="badge bg-emerald-50 text-emerald-700">Official government portal</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {built.stateName} · {built.portalName} · {new URL(built.portalUrl).hostname}
              </p>
            </div>
            <a href={built.portalUrl} target="_blank" rel="noopener noreferrer" className="btn-primary !py-2 text-xs">
              <ExternalLink className="h-3.5 w-3.5" /> Open official portal
            </a>
          </div>

          {built.details.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {built.details.map((d) => (
                <div key={d.label} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{d.label}</p>
                  <p className="mt-0.5 truncate text-xs font-bold text-gray-800">{d.value}</p>
                </div>
              ))}
            </div>
          )}

          <ol className="mt-4 space-y-2">
            {built.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-gray-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>

          {built.note && (
            <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-800">{built.note}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-50 pt-3">
            <button type="button" onClick={handleSaveRef} disabled={savingRef} className="btn-secondary !py-2 text-xs">
              {savingRef ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
              {savingRef ? 'Saving…' : 'Save to vault'}
            </button>
            <p className="text-[11px] text-gray-400">Saving keeps the portal link and these details handy in your vault.</p>
          </div>
        </div>
      )}

      {/* Saved references */}
      <div>
        <h2 className="text-sm font-bold text-gray-900">Saved official lookups</h2>
        {refs === null ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
          </div>
        ) : refs.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-10 text-center">
            <Globe className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-700">No saved lookups yet</p>
            <p className="mt-1 max-w-sm text-xs text-gray-500">
              Get a reference above and save it so the official portal link and your document number stay handy.
            </p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {refs.map((ref) => {
              const entry = getLookupEntry(ref.entryId);
              return (
                <article key={ref.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                      <Globe className="h-5 w-5 text-emerald-700" />
                    </span>
                    <span className="badge bg-emerald-50 text-emerald-700">Official link</span>
                  </div>
                  <h3 className="mt-4 break-words text-sm font-bold text-gray-900">{ref.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(ref.values).slice(0, 3).map(([k, v]) => (
                      <span key={k} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">{v}</span>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-gray-400">
                    {entry ? entry.portalName : 'Portal'} ·{' '}
                    {new Date(ref.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="mt-4 flex gap-2 border-t border-gray-50 pt-3">
                    {entry ? (
                      <a href={entry.portalUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-700">
                        <ExternalLink className="h-3.5 w-3.5" /> Open portal
                      </a>
                    ) : (
                      <span className="flex-1 py-2 text-center text-xs text-gray-400">Portal menu changed</span>
                    )}
                    <button
                      onClick={() => setRefDelete(ref)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
                      aria-label={`Delete ${ref.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {refDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </span>
              <h2 className="text-base font-bold text-gray-900">Remove this lookup?</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              <b>{refDelete.name}</b> will be removed from your vault. The government portal stays untouched — only the saved reference goes away.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setRefDelete(null)} className="btn-secondary flex-1" disabled={savingRef}>Keep it</button>
              <button onClick={handleDeleteRef} disabled={savingRef} className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60">
                {savingRef ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Upload a document</h2>
              <button onClick={() => { setUploadOpen(false); resetUpload(); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label htmlFor="docTitle" className="label">Document title</label>
                <input id="docTitle" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Aadhaar — Ananya Rao" className="input-field" />
              </div>

              <div>
                <label htmlFor="docCategory" className="label">Category</label>
                <select id="docCategory" value={uploadType} onChange={(e) => setUploadType(e.target.value as DocumentType)} className="input-field">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="docExpiry" className="label">
                  Expiry date <span className="font-normal text-gray-400">(optional — passport, DL, policy validity…)</span>
                </label>
                <input
                  id="docExpiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="input-field"
                />
                <p className="mt-1 text-[11px] text-gray-400">Used for expiry reminders on your dashboard.</p>
              </div>

              <div>
                <label htmlFor="docDescription" className="label">Description <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea id="docDescription" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={2} placeholder="Any notes about this document" className="input-field resize-none" />
              </div>

              <div>
                <label htmlFor="docFile" className="label">File</label>
                <input id="docFile" ref={fileInput} type="file" accept={ACCEPT} onChange={pickFile} className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700" />
                <p className="mt-1 text-[11px] text-gray-400">PDF, JPG, JPEG or PNG · up to {MAX_MB} MB</p>
              </div>

              {uploadFile && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <FileText className="h-5 w-5 shrink-0 text-blue-700" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-gray-800">{uploadFile.name}</p>
                    <p className="text-[11px] text-gray-500">{formatFileSize(uploadFile.size)}</p>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  <p className="text-xs text-red-700">{uploadError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setUploadOpen(false); resetUpload(); }} className="btn-secondary flex-1" disabled={uploading}>Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary flex-1">
                  {uploading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>) : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-gray-900">{previewDoc.name}</h2>
                <p className="text-xs text-gray-500">{documentLabel(previewDoc.type)} · {formatFileSize(previewDoc.size)}</p>
              </div>
              <button onClick={() => { setPreviewDoc(null); setPreviewUrl(null); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close preview">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-[300px] flex-1 overflow-auto rounded-b-2xl bg-gray-50 p-6">
              {previewLoading ? (
                <div className="flex h-full items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>
              ) : previewUrl ? (
                previewDoc.fileType === 'pdf' ? (
                  <iframe src={previewUrl} title={`Preview of ${previewDoc.name}`} className="h-[60vh] w-full rounded-xl border border-gray-200 bg-white" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={`Preview of ${previewDoc.name}`} className="mx-auto max-h-[60vh] rounded-xl border border-gray-200 bg-white" />
                )
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <FileQuestion className="h-10 w-10 text-gray-300" />
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">{previewError || 'Preview unavailable.'}</p>
                  <a href={`/api/documents/${previewDoc.id}/file?download=1`} className="btn-secondary mt-4 !py-2 text-xs"><Download className="h-3.5 w-3.5" /> Download instead</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </span>
              <h2 className="text-base font-bold text-gray-900">Delete this document?</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              <b>{deleteTarget.name}</b> and its stored file will be permanently removed. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1" disabled={deleting}>Keep it</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60">
                {deleting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocExpiryBadge({ iso }: { iso: string }) {
  const days = daysUntil(iso);
  const label = new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const expired = days !== null && days < 0;
  const soon = days !== null && days >= 0 && days <= 30;
  const cls = expired
    ? 'bg-red-50 text-red-700 border border-red-200'
    : soon
      ? 'bg-amber-50 text-amber-700 border border-amber-200'
      : 'bg-gray-100 text-gray-600';
  return (
    <p className="mt-1.5">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
        Valid till {label}{expired ? ' · expired' : soon ? ` · ${days === 0 ? 'today' : `${days}d left`}` : ''}
      </span>
    </p>
  );
}
