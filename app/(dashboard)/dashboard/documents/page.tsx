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
} from 'lucide-react';
import type { Document as VaultDocument, DocumentType } from '@/lib/types';
import { formatFileSize, getDocumentIcon } from '@/lib/utils';
import { documentLabel } from '@/lib/eligibility';

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

  const loadDocs = useCallback(async () => {
    try {
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
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Documents</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Store important family documents privately. Files are never exposed through public links.
          </p>
        </div>
        <button onClick={() => { setUploadOpen(true); setUploadError(''); }} className="btn-primary w-full sm:w-auto">
          <UploadCloud className="h-4 w-4" /> Upload Document
        </button>
      </div>

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
