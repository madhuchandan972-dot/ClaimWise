'use client';

import { useCallback, useEffect, useState } from 'react';
import { PhoneCall, Plus, Pencil, Trash2, Loader2, AlertTriangle, Mail, Phone, Printer } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { EmergencyContact } from '@/lib/types';

type FormState = { name: string; relationship: string; phone: string; email: string };
const EMPTY: FormState = { name: '', relationship: '', phone: '', email: '' };

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<EmergencyContact[] | null>(null);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmergencyContact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/emergency-contacts');
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Could not load emergency contacts.');
        setContacts([]);
        return;
      }
      setContacts(data.contacts as EmergencyContact[]);
      setError('');
    } catch {
      setError('Network error while loading emergency contacts.');
      setContacts([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(contact: EmergencyContact) {
    setEditing(contact);
    setForm({ name: contact.name, relationship: contact.relationship, phone: contact.phone, email: contact.email });
    setFormError('');
    setFormOpen(true);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) { setFormError('Enter the contact name.'); return; }
    if (!form.phone.trim() && !form.email.trim()) {
      setFormError('Add at least a phone number or an email address.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch(editing ? `/api/emergency-contacts/${editing.id}` : '/api/emergency-contacts', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error ?? 'Could not save the contact.');
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
      const res = await fetch(`/api/emergency-contacts/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Could not delete the contact.');
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
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Emergency Contacts</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            The people your family should be able to reach quickly.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <a href="/dashboard/emergency-card" className="btn-secondary inline-flex w-full items-center justify-center gap-2 sm:w-auto">
            <Printer className="h-4 w-4" /> Emergency card
          </a>
          <button onClick={openCreate} className="btn-primary w-full sm:w-auto"><Plus className="h-4 w-4" /> Add Contact</button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {contacts === null ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-700" /></div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <PhoneCall className="h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-semibold text-gray-700">No emergency contacts yet</p>
          <p className="mt-1 text-xs text-gray-500">Add a trusted person your family can call.</p>
          <button onClick={openCreate} className="btn-secondary mt-4 !py-2 text-xs"><Plus className="h-3.5 w-3.5" /> Add your first contact</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((contact) => (
            <article key={contact.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-50 text-purple-700">
                  <PhoneCall className="h-5 w-5" />
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(contact)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-700" aria-label={`Edit ${contact.name}`}><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget(contact)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${contact.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <h2 className="mt-3 text-sm font-bold text-gray-900">{contact.name}</h2>
              <p className="text-xs text-gray-500">{contact.relationship || 'Relationship not specified'}</p>
              <div className="mt-3 space-y-1.5 text-xs">
                {contact.phone && <p className="flex items-center gap-2 text-gray-700"><Phone className="h-3.5 w-3.5 text-gray-400" /> {contact.phone}</p>}
                {contact.email && <p className="flex items-center gap-2 break-all text-gray-700"><Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" /> {contact.email}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit contact' : 'Add emergency contact'} size="md">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label htmlFor="contactName" className="label">Contact name</label>
            <input id="contactName" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={120} className="input-field" placeholder="e.g. Ramesh Rao" />
          </div>
          <div>
            <label htmlFor="relationship" className="label">Relationship</label>
            <input id="relationship" value={form.relationship} onChange={(e) => set('relationship', e.target.value)} maxLength={80} className="input-field" placeholder="e.g. Spouse, Brother, Family friend" />
          </div>
          <div>
            <label htmlFor="contactPhone" className="label">Phone number</label>
            <input id="contactPhone" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} maxLength={20} className="input-field" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label htmlFor="contactEmail" className="label">Email address</label>
            <input id="contactEmail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} maxLength={160} className="input-field" placeholder="name@example.com" />
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
              {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : 'Save contact'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete this contact?" size="sm">
        <p className="text-sm leading-relaxed text-gray-600">
          <b>{deleteTarget?.name}</b> will be permanently removed from your vault. This cannot be undone.
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
