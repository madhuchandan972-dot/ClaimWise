'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Pencil, Trash2, Loader2, AlertTriangle, MapPin, FileText } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Document as VaultDocument, PropertyRecord } from '@/lib/types';
import { documentLabel } from '@/lib/eligibility';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Land', 'Agricultural', 'Other'] as const;

type FormState = {
  propertyName: string;
  propertyType: string;
  location: string;
  ownershipDetails: string;
  registrationNumber: string;
  registrationDate: string;
  notes: string;
  documentIds: string[];
};

const EMPTY: FormState = {
  propertyName: '',
  propertyType: 'Residential',
  location: '',
  ownershipDetails: '',
  registrationNumber: '',
  registrationDate: '',
  notes: '',
  documentIds: [],
};

export default function PropertyPage() {
  const [records, setRecords] = useState<PropertyRecord[] | null>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PropertyRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [propertyRes, docRes] = await Promise.all([
        fetch('/api/properties').then((r) => r.json()),
        fetch('/api/documents').then((r) => r.json()),
      ]);
      if (!propertyRes.success) {
        setError(propertyRes.error ?? 'Could not load property records.');
        setRecords([]);
        return;
      }
      setRecords(propertyRes.properties as PropertyRecord[]);
      if (docRes.success) setDocuments(docRes.documents as VaultDocument[]);
      setError('');
    } catch {
      setError('Network error while loading property records.');
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

  function openEdit(record: PropertyRecord) {
    setEditing(record);
    setForm({
      propertyName: record.propertyName,
      propertyType: record.propertyType,
      location: record.location,
      ownershipDetails: record.ownershipDetails,
      registrationNumber: record.registrationNumber,
      registrationDate: record.registrationDate?.slice(0, 10) ?? '',
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
    if (form.propertyName.trim().length < 2) {
      setFormError('Enter a property name.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch(editing ? `/api/properties/${editing.id}` : '/api/properties', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, registrationDate: form.registrationDate || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error ?? 'Could not save the property.');
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
      const res = await fetch(`/api/properties/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Could not delete the property.');
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
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Property Details</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Keep property ownership, location and registration information in your private vault.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary w-full sm:w-auto"><Plus className="h-4 w-4" /> Add Property</button>
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
          <Building2 className="h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-semibold text-gray-700">No property records yet</p>
          <p className="mt-1 text-xs text-gray-500">Add a property to keep its details with your family vault.</p>
          <button onClick={openCreate} className="btn-secondary mt-4 !py-2 text-xs"><Plus className="h-3.5 w-3.5" /> Add your first property</button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {records.map((record) => (
            <article key={record.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{record.propertyName}</h2>
                  <p className="mt-0.5 text-xs font-medium text-purple-700">{record.propertyType}</p>
                </div>
                <span className="badge bg-blue-50 text-blue-700">{record.documentIds.length} linked doc{record.documentIds.length === 1 ? '' : 's'}</span>
              </div>

              <dl className="mt-4 space-y-2 text-xs">
                {record.location && (
                  <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" /><span className="text-gray-600">{record.location}</span></div>
                )}
                {record.ownershipDetails && (
                  <div><dt className="font-semibold text-gray-500">Ownership</dt><dd className="mt-0.5 whitespace-pre-line text-gray-600">{record.ownershipDetails}</dd></div>
                )}
                {record.registrationNumber && (
                  <div><dt className="font-semibold text-gray-500">Registration number</dt><dd className="mt-0.5 text-gray-600">{record.registrationNumber}</dd></div>
                )}
                {record.registrationDate && (
                  <div><dt className="font-semibold text-gray-500">Registration date</dt><dd className="mt-0.5 text-gray-600">{new Date(record.registrationDate).toLocaleDateString('en-IN')}</dd></div>
                )}
                {record.notes && (
                  <div><dt className="font-semibold text-gray-500">Notes</dt><dd className="mt-0.5 whitespace-pre-line text-gray-600">{record.notes}</dd></div>
                )}
              </dl>

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
                <button onClick={() => setDeleteTarget(record)} className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-red-300 hover:text-red-600" aria-label={`Delete ${record.propertyName}`}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit property' : 'Add property'} size="xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="propertyName" className="label">Property name</label>
              <input id="propertyName" value={form.propertyName} onChange={(e) => set('propertyName', e.target.value)} maxLength={120} className="input-field" placeholder="e.g. Family home — Jayanagar" />
            </div>
            <div>
              <label htmlFor="propertyType" className="label">Property type</label>
              <select id="propertyType" value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)} className="input-field">
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="location" className="label">Location</label>
            <input id="location" value={form.location} onChange={(e) => set('location', e.target.value)} maxLength={300} className="input-field" placeholder="Address, city, state" />
          </div>

          <div>
            <label htmlFor="ownership" className="label">Ownership details</label>
            <textarea id="ownership" value={form.ownershipDetails} onChange={(e) => set('ownershipDetails', e.target.value)} maxLength={1000} rows={2} className="input-field resize-none" placeholder="Owner name(s), share, co-owners" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="registrationNumber" className="label">Registration number</label>
              <input id="registrationNumber" value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} maxLength={120} className="input-field" />
            </div>
            <div>
              <label htmlFor="registrationDate" className="label">Registration date</label>
              <input id="registrationDate" type="date" value={form.registrationDate} onChange={(e) => set('registrationDate', e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label htmlFor="propertyNotes" className="label">Notes <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea id="propertyNotes" value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={2000} rows={2} className="input-field resize-none" />
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
              {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : 'Save property'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete this property?" size="sm">
        <p className="text-sm leading-relaxed text-gray-600">
          <b>{deleteTarget?.propertyName}</b> will be permanently removed from your vault. Linked documents stay in your Documents section. This cannot be undone.
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
