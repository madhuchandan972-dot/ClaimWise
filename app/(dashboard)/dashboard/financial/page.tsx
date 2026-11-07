'use client';

import { useCallback, useEffect, useState } from 'react';
import { Wallet, Plus, Pencil, Trash2, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { FinancialRecord } from '@/lib/types';

const RECORD_TYPES = [
  { value: 'loan', label: 'Loan' },
  { value: 'debt', label: 'Outstanding debt' },
  { value: 'obligation', label: 'Financial obligation' },
  { value: 'bank_reference', label: 'Bank account reference' },
  { value: 'note', label: 'Important financial note' },
];

type FormState = {
  recordType: string;
  institution: string;
  description: string;
  amount: string;
  outstandingAmount: string;
  accountReference: string;
  dueDate: string;
  notes: string;
};

const EMPTY: FormState = {
  recordType: 'loan',
  institution: '',
  description: '',
  amount: '',
  outstandingAmount: '',
  accountReference: '',
  dueDate: '',
  notes: '',
};

function money(value?: number) {
  if (value === undefined || value === null) return '—';
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function FinancialPage() {
  const [records, setRecords] = useState<FinancialRecord[] | null>(null);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FinancialRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/financial');
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Could not load financial records.');
        setRecords([]);
        return;
      }
      setRecords(data.records as FinancialRecord[]);
      setError('');
    } catch {
      setError('Network error while loading financial records.');
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

  function openEdit(record: FinancialRecord) {
    setEditing(record);
    setForm({
      recordType: record.recordType,
      institution: record.institution,
      description: record.description,
      amount: record.amount !== undefined ? String(record.amount) : '',
      outstandingAmount: record.outstandingAmount !== undefined ? String(record.outstandingAmount) : '',
      accountReference: record.accountReference,
      dueDate: record.dueDate?.slice(0, 10) ?? '',
      notes: record.notes,
    });
    setFormError('');
    setFormOpen(true);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function numeric(value: string): number | null {
    if (!value.trim()) return null;
    const n = Number(value.replace(/,/g, ''));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.description.trim().length < 2) {
      setFormError('Describe this financial record.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        amount: numeric(form.amount),
        outstandingAmount: numeric(form.outstandingAmount),
        dueDate: form.dueDate || null,
      };
      const res = await fetch(editing ? `/api/financial/${editing.id}` : '/api/financial', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error ?? 'Could not save the record.');
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
      const res = await fetch(`/api/financial/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Could not delete the record.');
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
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Financial Information</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Record loans, debts, obligations and bank references so your family knows what exists.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary w-full sm:w-auto"><Plus className="h-4 w-4" /> Add Record</button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs leading-relaxed text-amber-800">
          Never enter banking passwords, PINs, CVVs or OTPs. ClaimWise does not ask for them and has no
          field in which to store them. Account references are for identification only.
        </p>
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
          <Wallet className="h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-semibold text-gray-700">No financial records yet</p>
          <p className="mt-1 text-xs text-gray-500">Add a loan, debt or obligation your family should know about.</p>
          <button onClick={openCreate} className="btn-secondary mt-4 !py-2 text-xs"><Plus className="h-3.5 w-3.5" /> Add your first record</button>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const type = RECORD_TYPES.find((t) => t.value === record.recordType)?.label ?? record.recordType;
            return (
              <article key={record.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge bg-purple-50 text-purple-700">{type}</span>
                      {record.institution && <span className="text-xs font-semibold text-gray-600">{record.institution}</span>}
                    </div>
                    <h2 className="mt-2 text-sm font-bold text-gray-900">{record.description}</h2>
                    {record.notes && <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-gray-500">{record.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => openEdit(record)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-700" aria-label={`Edit ${record.description}`}><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget(record)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-red-300 hover:text-red-600" aria-label={`Delete ${record.description}`}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-50 pt-3 text-xs sm:grid-cols-4">
                  <div><dt className="text-gray-400">Amount</dt><dd className="mt-0.5 font-semibold text-gray-800">{money(record.amount)}</dd></div>
                  <div><dt className="text-gray-400">Outstanding</dt><dd className="mt-0.5 font-semibold text-gray-800">{money(record.outstandingAmount)}</dd></div>
                  <div><dt className="text-gray-400">Account reference</dt><dd className="mt-0.5 break-words font-semibold text-gray-800">{record.accountReference || '—'}</dd></div>
                  <div><dt className="text-gray-400">Due date</dt><dd className="mt-0.5 font-semibold text-gray-800">{record.dueDate ? new Date(record.dueDate).toLocaleDateString('en-IN') : '—'}</dd></div>
                </dl>
              </article>
            );
          })}
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit financial record' : 'Add financial record'} size="xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="recordType" className="label">Record type</label>
              <select id="recordType" value={form.recordType} onChange={(e) => set('recordType', e.target.value)} className="input-field">
                {RECORD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="institution" className="label">Bank / lender / institution</label>
              <input id="institution" value={form.institution} onChange={(e) => set('institution', e.target.value)} maxLength={160} className="input-field" placeholder="e.g. State Bank of India" />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="label">Description</label>
            <input id="description" value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={300} className="input-field" placeholder="e.g. Home loan — Jayanagar property" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="amount" className="label">Amount (₹) <span className="font-normal text-gray-400">(optional)</span></label>
              <input id="amount" inputMode="numeric" value={form.amount} onChange={(e) => set('amount', e.target.value)} className="input-field" placeholder="e.g. 2500000" />
            </div>
            <div>
              <label htmlFor="outstanding" className="label">Outstanding amount (₹) <span className="font-normal text-gray-400">(optional)</span></label>
              <input id="outstanding" inputMode="numeric" value={form.outstandingAmount} onChange={(e) => set('outstandingAmount', e.target.value)} className="input-field" placeholder="e.g. 1800000" />
            </div>
            <div>
              <label htmlFor="accountReference" className="label">Account / loan reference <span className="font-normal text-gray-400">(optional)</span></label>
              <input id="accountReference" value={form.accountReference} onChange={(e) => set('accountReference', e.target.value)} maxLength={120} className="input-field" placeholder="Last 4 digits or loan account number" />
            </div>
            <div>
              <label htmlFor="dueDate" className="label">Next due date <span className="font-normal text-gray-400">(optional)</span></label>
              <input id="dueDate" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label htmlFor="financialNotes" className="label">Notes <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea id="financialNotes" value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={2000} rows={2} className="input-field resize-none" placeholder="Anything your family should know" />
          </div>

          {formError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-700">{formError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary flex-1" disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : 'Save record'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete this record?" size="sm">
        <p className="text-sm leading-relaxed text-gray-600">
          <b>{deleteTarget?.description}</b> will be permanently removed from your vault. This cannot be undone.
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
