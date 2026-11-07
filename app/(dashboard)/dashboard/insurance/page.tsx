'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2, Loader2, AlertTriangle, FileText, CalendarClock } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Document as VaultDocument, InsuranceRecord } from '@/lib/types';
import { documentLabel } from '@/lib/eligibility';

const POLICY_TYPES = ['Life', 'Health', 'Vehicle', 'Home', 'Travel', 'Other'] as const;

type FormState = {
  provider: string;
  policyType: string;
  policyNumber: string;
  policyholderName: string;
  expiryDate: string;
  premiumAmount: string;
  notes: string;
  documentIds: string[];
};

const EMPTY: FormState = {
  provider: '',
  policyType: 'Life',
  policyNumber: '',
  policyholderName: '',
  expiryDate: '',
  premiumAmount: '',
  notes: '',
  documentIds: [],
};

export default function InsurancePage() {
  const [records, setRecords] = useState<InsuranceRecord[] | null>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InsuranceRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InsuranceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [insuranceRes, docRes] = await Promise.all([
        fetch('/api/insurance').then((r) => r.json()),
        fetch('/api/documents').then((r) => r.json()),
      ]);
      if (!insuranceRes.success) {
        setError(insuranceRes.error ?? 'Could not load insurance policies.');
        setRecords([]);
        return;
      }
      setRecords(insuranceRes.records as InsuranceRecord[]);
      if (docRes.success) setDocuments(docRes.documents as VaultDocument[]);
      setError('');
    } catch {
      setError('Network error while loading insurance policies.');
      setRecords([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(record: InsuranceRecord) {
    setEditing(record);
    setForm({
      provider: record.provider,
      policyType: record.policyType,
      policyNumber: record.policyNumber,
      policyholderName: record.policyholderName,
      expiryDate: record.expiryDate?.slice(0, 10) ?? '',
      premiumAmount: record.premiumAmount !== undefined ? String(record.premiumAmount) : '',
      notes: record.notes,
      documentIds: record.documentIds,
    });
    setFormError('');
    setFormOpen(true);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDocument(id: string) {
    setForm((prev) => ({
      ...prev,
      documentIds: prev.documentIds.includes(id)
        ? prev.documentIds.filter((x) => x !== id)
        : [...prev.documentIds, id],
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.provider.trim().length < 2) {
      setFormError('Enter the insurance provider.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const premium = form.premiumAmount.trim() ? Number(form.premiumAmount) : null;
      const res = await fetch(editing ? `/api/insurance/${editing.id}` : '/api/insurance', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          premiumAmount: premium !== null && Number.isFinite(premium) ? premium : null,
          expiryDate: form.expiryDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error ?? 'Could not save the policy.');
        return;
      }
      setFormOpen(false);
      await load();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/insurance/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Could not delete the policy.');
        return;
      }
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Insurance</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Keep policy numbers, policyholders and expiry dates where your family can find them.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary w-full sm:w-auto"><Plus className="h-4 w-4" /> Add Policy</button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {records === null ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-700" /></div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <ShieldCheck className="h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-semibold text-gray-700">No insurance policies yet</p>
          <p className="mt-1 text-xs text-gray-500">Add a policy so its details are not lost.</p>
          <button onClick={openCreate} className="btn-secondary mt-4 !py-2 text-xs"><Plus className="h-3.5 w-3.5" /> Add your first policy</button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {records.map((record) => {
            const expired = record.expiryDate ? new Date(record.expiryDate) < new Date() : false;
            return (
              <article key={record.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{record.provider}</h2>
                    <p className="mt-0.5 text-xs font-medium text-purple-700">{record.policyType} insurance</p>
                  </div>
                  {record.expiryDate && (
                    <span className={`badge ${expired ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      <CalendarClock className="mr-1 h-3 w-3" />
                      {expired ? 'Expired' : 'Active'} · {new Date(record.expiryDate).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div><dt className="text-gray-400">Policy number</dt><dd className="mt-0.5 break-words font-semibold text-gray-800">{record.policyNumber || '—'}</dd></div>
                  <div><dt className="text-gray-400">Policyholder</dt><dd className="mt-0.5 font-semibold text-gray-800">{record.policyholderName || '—'}</dd></div>
                  <div><dt className="text-gray-400">Premium</dt><dd className="mt-0.5 font-semibold text-gray-800">{record.premiumAmount !== undefined ? `₹${record.premiumAmount.toLocaleString('en-IN')}` : '—'}</dd></div>
                  <div><dt className="text-gray-400">Expiry date</dt><dd className="mt-0.5 font-semibold text-gray-800">{record.expiryDate ? new Date(record.expiryDate).toLocaleDateString('en-IN') : '—'}</dd></div>
                </dl>

                {record.notes && <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-gray-500">{record.notes}</p>}

                {record.documentIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {record.documentIds.map((id) => {
                      const doc = documents.find((d) => d.id === id);
                      return doc ? (
                        <a key={id} href={`/api/documents/${id}/file?download=1`} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-200">
                          <FileText className="h-3 w-3" /> {doc.name}
                        </a>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="mt-4 flex gap-2 border-t border-gray-50 pt-3">
                  <button onClick={() => openEdit(record)} className="btn-secondary flex-1 !py-2 text-xs"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => setDeleteTarget(record)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-red-300 hover:text-red-600" aria-label={`Delete ${record.provider} policy`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit insurance policy' : 'Add insurance policy'} size="xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="provider" className="label">Insurance provider</label>
              <input id="provider" value={form.provider} onChange={(e) => set('provider', e.target.value)} maxLength={160} className="input-field" placeholder="e.g. LIC of India" />
            </div>
            <div>
              <label htmlFor="policyType" className="label">Policy type</label>
              <select id="policyType" value={form.policyType} onChange={(e) => set('policyType', e.target.value)} className="input-field">
                {POLICY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="policyNumber" className="label">Policy number</label>
              <input id="policyNumber" value={form.policyNumber} onChange={(e) => set('policyNumber', e.target.value)} maxLength={120} className="input-field" />
            </div>
            <div>
              <label htmlFor="policyholder" className="label">Policyholder name</label>
              <input id="policyholder" value={form.policyholderName} onChange={(e) => set('policyholderName', e.target.value)} maxLength={160} className="input-field" />
            </div>
            <div>
              <label htmlFor="expiryDate" className="label">Expiry date</label>
              <input id="expiryDate" type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="premium" className="label">Premium amount (₹)</label>
              <input id="premium" inputMode="numeric" value={form.premiumAmount} onChange={(e) => set('premiumAmount', e.target.value)} className="input-field" placeholder="Optional" />
            </div>
          </div>

          <div>
            <label htmlFor="insuranceNotes" className="label">Notes <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea id="insuranceNotes" value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={2000} rows={2} className="input-field resize-none" />
          </div>

          {documents.length > 0 && (
            <div>
              <p className="label">Related documents</p>
              <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-xl border border-gray-200 p-3">
                {documents.map((doc) => (
                  <label key={doc.id} className="flex items-center gap-2 text-xs text-gray-700">
                    <input type="checkbox" checked={form.documentIds.includes(doc.id)} onChange={() => toggleDocument(doc.id)} className="h-3.5 w-3.5 rounded border-gray-300" />
                    <span className="truncate">{doc.name}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-gray-400">{documentLabel(doc.type)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-700">{formError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary flex-1" disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : 'Save policy'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete this policy?" size="sm">
        <p className="text-sm leading-relaxed text-gray-600">
          The <b>{deleteTarget?.provider}</b> policy will be permanently removed. Linked documents stay in your Documents section. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1" disabled={deleting}>Cancel</button>
          <button onClick={remove} disabled={deleting} className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {deleting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
