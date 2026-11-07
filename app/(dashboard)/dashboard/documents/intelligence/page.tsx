'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Save,
  Eye,
  FlaskConical,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import type { Document } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';
import { documentLabel } from '@/lib/eligibility';

interface ExtractionResult {
  mode: 'gemini' | 'simulated';
  documentType: string;
  extractedData: Record<string, string>;
  missingFields: string[];
  warnings: string[];
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Full name',
  fatherName: "Father's name",
  dob: 'Date of birth',
  gender: 'Gender',
  documentNumber: 'Document number',
  issueDate: 'Issue date',
  expiryDate: 'Expiry date',
  issuedBy: 'Issuing authority',
  percentage: 'Percentage',
  annualIncome: 'Annual income',
  category: 'Category',
  address: 'Address',
};

const APPLICABLE_PROFILE_FIELDS: { key: string; label: string; hint: string }[] = [
  { key: 'name', label: 'Full name', hint: 'Applies to student profile → name' },
  { key: 'dob', label: 'Date of birth', hint: 'Applies to student profile → dob (YYYY-MM-DD)' },
  { key: 'gender', label: 'Gender', hint: 'Applies to student profile → gender' },
  { key: 'state', label: 'Home state', hint: 'Applies to student profile → state' },
  { key: 'category', label: 'Social category (General/SC/ST/OBC/EWS)', hint: 'Applies to student profile → category' },
  { key: 'annualIncome', label: 'Annual family income', hint: 'Numeric amount only, in ₹' },
];

export default function DocumentIntelligencePage() {
  const [docs, setDocs] = useState<Document[] | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [result, setResult] = useState<{ doc: Document; extraction: ExtractionResult } | null>(null);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');
  const [applying, setApplying] = useState(false);

  const loadDocs = useCallback(async () => {
    const r = await fetch('/api/documents');
    const data = await r.json();
    if (data.success) setDocs(data.documents as Document[]);
  }, []);

  useEffect(() => {
    loadDocs();
    // Whether real AI is configured decides the honest banner below —
    // never hardcode one mode; ask the server.
    fetch('/api/integrations/status')
      .then((r) => r.json())
      .then((d) => setAiAvailable(Boolean(d?.success && d.ai?.documentIntelligence)))
      .catch(() => setAiAvailable(false));
  }, [loadDocs]);

  async function analyze(doc: Document) {
    setAnalyzing(doc.id);
    setApplyError('');
    setApplySuccess('');
    try {
      const r = await fetch(`/api/documents/${doc.id}/analyze`, { method: 'POST' });
      const data = await r.json();
      if (!data.success) {
        setApplyError(data.error);
        return;
      }
      setResult({ doc: data.document, extraction: data.extraction });
      await loadDocs();
    } catch {
      setApplyError('Network error while analysing. Please try again.');
    } finally {
      setAnalyzing(null);
    }
  }

  async function approveAndApply(fields: Record<string, string>, doc: Document) {
    setApplying(true);
    setApplyError('');
    try {
      const r = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      const d = await r.json();
      if (!d.success) {
        setApplyError(d.error ?? 'Could not save the approved fields.');
        return;
      }
      setApplySuccess(
        `Approved fields were saved to your profile from "${doc.name}". Review them in your Student Profile.`
      );
      setResult(null);
      await loadDocs();
    } catch {
      setApplyError('Network error while saving. Please try again.');
    } finally {
      setApplying(false);
    }
  }

  const pending = docs?.filter((d) => d.status === 'pending') ?? [];
  const processed = docs?.filter((d) => d.status === 'processed') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Document Intelligence</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Run AI analysis on your vault documents, review what gets extracted field by field,
          and approve only the information you want in your student profile.
        </p>
      </div>

      {/* Status banner — reflects the real server configuration */}
      {aiAvailable === null && (
        <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Checking AI configuration…</p>
        </div>
      )}
      {aiAvailable === false && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Demo mode active — extraction is simulated
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700">
              When a document is analysed, the fields shown are <b>pre-defined sample values</b>,
              not text read from your file. Review the labels carefully — simulated values are
              marked. Real AI extraction activates once <code className="rounded bg-amber-100 px-1">GOOGLE_GEMINI_API_KEY</code> is
              configured on the server (see README, §AI Setup).
            </p>
          </div>
        </div>
      )}
      {aiAvailable === true && (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              Real AI is active — extraction runs on Google Gemini
            </p>
            <p className="mt-1 text-xs leading-relaxed text-green-700">
              Analysis sends the document to Gemini server-side and extracts the fields it can
              read. Review every field below before approving — you choose what lands in your
              profile.
            </p>
          </div>
        </div>
      )}

      {applyError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-600">{applyError}</p>
        </div>
      )}
      {applySuccess && (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <p className="text-xs text-green-700">{applySuccess}</p>
        </div>
      )}

      {/* Pending documents */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-gray-800">Ready to analyse ({pending.length})</h2>
        {docs === null ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        ) : pending.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">
            Everything in your vault is processed.
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {pending.map((doc) => (
              <li key={doc.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🧾</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {documentLabel(doc.type)} · {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
                <button onClick={() => analyze(doc)} disabled={analyzing !== null} className="btn-primary !px-4 !py-2 text-xs">
                  {analyzing === doc.id ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analysing…</>) : (<><Sparkles className="h-3.5 w-3.5" /> Analyse</>)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Processed documents */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-gray-800">Extractions completed ({processed.length})</h2>
        {processed.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">
            No analysed documents yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {processed.map((doc) => (
              <article key={doc.id} className="rounded-2xl border border-gray-100 p-4 transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="truncate text-sm font-bold text-gray-900">{doc.name}</h3>
                  <Badge variant={doc.extractionMode === 'simulated' ? 'warning' : 'success'}>
                    {doc.extractionMode === 'simulated' ? 'Simulated' : 'AI-extracted'}
                  </Badge>
                </div>
                {doc.extractedData ? (
                  <dl className="space-y-1">
                    {Object.entries(doc.extractedData).slice(0, 4).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 text-xs">
                        <dt className="shrink-0 text-gray-400">{FIELD_LABELS[k] ?? k}</dt>
                        <dd className="truncate text-gray-700" title={v}>{v}</dd>
                      </div>
                    ))}
                    {Object.keys(doc.extractedData).length > 4 && (
                      <p className="pt-1 text-[11px] text-gray-400">+ {Object.keys(doc.extractedData).length - 4} more fields</p>
                    )}
                  </dl>
                ) : (
                  <p className="text-xs text-gray-400">No fields stored.</p>
                )}
                <div className="mt-3 flex gap-2 border-t border-gray-50 pt-3">
                  <button onClick={() => setResult({ doc, extraction: { mode: doc.extractionMode ?? 'simulated', documentType: doc.type, extractedData: doc.extractedData ?? {}, missingFields: [], warnings: ['Previously extracted data — review before applying.'] } })} className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-700">
                    <Eye className="mr-1 inline h-3 w-3" /> Review & apply
                  </button>
                  <Link href="/dashboard/profile" className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                    Profile
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Review modal ── */}
      {result && (
        <Modal
          isOpen={!!result}
          onClose={() => setResult(null)}
          title="Review extracted information"
          size="lg"
        >
          <ReviewBody
            result={result.extraction}
            docName={result.doc.name}
            applying={applying}
            onBack={() => setResult(null)}
            onApply={(fields) => approveAndApply(fields, result.doc)}
          />
        </Modal>
      )}
    </div>
  );
}

function ReviewBody({
  result,
  docName,
  applying,
  onBack,
  onApply,
}: {
  result: ExtractionResult;
  docName: string;
  applying: boolean;
  onBack: () => void;
  onApply: (fields: Record<string, string>) => void;
}) {
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const [edited, setEdited] = useState<Record<string, string>>({});

  const entries = Object.entries(result.extractedData);

  function approvedFields(): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const [k, v] of entries) {
      if (approved[k] && APPLICABLE_PROFILE_FIELDS.some((f) => f.key === k)) {
        // Only send profile-mappable fields with cleaned values
        const value = (edited[k] ?? v).replace(/\s*\(simulated\)\s*$/i, '').trim();
        if (value) fields[k] = value;
      }
    }
    return fields;
  }

  const applicableApproved = Object.keys(approvedFields());

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-gray-500">
        Document: <b>{docName}</b> · Check every field below. Ticked fields that map to your
        profile can be applied when you approve.
      </p>

      {result.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          {result.warnings.map((w, i) => (
            <p key={i} className="text-xs leading-relaxed text-amber-700">{w}</p>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">No fields were extracted from this document.</p>
      ) : (
        <ul className="divide-y divide-gray-50 rounded-xl border border-gray-100">
          {entries.map(([key, value]) => {
            const mappable = APPLICABLE_PROFILE_FIELDS.some((f) => f.key === key);
            return (
              <li key={key} className="flex items-start gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={approved[key] ?? false}
                  onChange={(e) => setApproved((p) => ({ ...p, [key]: e.target.checked }))}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label={`Approve ${FIELD_LABELS[key] ?? key}`}
                  disabled={!mappable}
                  title={mappable ? 'Approve this field' : 'This field is not applied to the profile automatically'}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-700">
                    {FIELD_LABELS[key] ?? key}
                    {mappable ? (
                      <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">profile field</span>
                    ) : (
                      <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">informational</span>
                    )}
                  </p>
                  {key === 'dob' ? (
                    <input
                      value={edited[key] ?? value}
                      onChange={(e) => setEdited((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder="YYYY-MM-DD"
                      className="input-field mt-1 !px-2 !py-1.5 text-xs"
                    />
                  ) : (
                    <input
                      value={edited[key] ?? value}
                      onChange={(e) => setEdited((p) => ({ ...p, [key]: e.target.value }))}
                      className="input-field mt-1 !px-2 !py-1.5 text-xs"
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {result.missingFields.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700">Fields not found in the document:</p>
          <ul className="mt-1 list-inside list-disc text-xs text-gray-500">
            {result.missingFields.map((f) => (<li key={f}>{FIELD_LABELS[f] ?? f}</li>))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 border-t border-gray-100 pt-3">
        <button onClick={onBack} className="btn-secondary flex-1 !py-2.5 text-sm" disabled={applying}>Back</button>
        <button
          onClick={() => onApply(approvedFields())}
          disabled={applying || applicableApproved.length === 0}
          className="btn-primary flex-1 !py-2.5 text-sm"
          title={applicableApproved.length === 0 ? 'Tick at least one profile field to apply' : ''}
        >
          {applying ? (<><Loader2 className="h-4 w-4 animate-spin" />Saving…</>) : (<><Save className="h-4 w-4" />Apply {applicableApproved.length || 'no'} field{applicableApproved.length === 1 ? '' : 's'}</>)}
        </button>
      </div>
    </div>
  );
}
