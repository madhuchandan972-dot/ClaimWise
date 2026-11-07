'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FolderOpen,
  Building2,
  Wallet,
  ShieldCheck,
  PhoneCall,
  Eye,
  Download,
  Mail,
} from 'lucide-react';
import type {
  Document as VaultDocument,
  EmergencyContact,
  FinancialRecord,
  InsuranceRecord,
  PropertyRecord,
} from '@/lib/types';
import { documentLabel } from '@/lib/eligibility';
import { formatFileSize } from '@/lib/utils';

interface SharedVaultData {
  owner: { id: string; name: string; email: string };
  relationship: string;
  properties: PropertyRecord[];
  financialRecords: FinancialRecord[];
  insuranceRecords: InsuranceRecord[];
  contacts: EmergencyContact[];
}

export default function SharedVaultPage({ params }: { params: Promise<{ ownerId: string }> }) {
  const { ownerId } = use(params);
  const [vault, setVault] = useState<SharedVaultData | null>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`/api/shared/${ownerId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!active) return;
        if (!r.ok || !data.success) {
          setError(data.error ?? 'You do not have access to this vault.');
          return;
        }
        setVault(data.vault as SharedVaultData);
        setDocuments(data.documents as VaultDocument[]);
      })
      .catch(() => active && setError('Network error while loading the shared vault.'));
    return () => { active = false; };
  }, [ownerId]);

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/family-access" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Family Access
        </Link>
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!vault) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/family-access" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Family Access
      </Link>

      <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vault.owner.name}&apos;s vault</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
              <Mail className="h-3.5 w-3.5" /> {vault.owner.email} · shared with you as {vault.relationship}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-purple-700">
            <Eye className="h-3.5 w-3.5" /> Read-only access
          </span>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800"><FolderOpen className="h-4 w-4 text-blue-700" /> Documents ({documents.length})</h2>
        {documents.length === 0 ? (
          <p className="py-4 text-xs text-gray-400">No documents stored.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-50">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{doc.name}</p>
                  <p className="text-[11px] text-gray-400">{documentLabel(doc.type)} · {formatFileSize(doc.size)}</p>
                </div>
                <a href={`/api/documents/${doc.id}/file`} target="_blank" rel="noopener noreferrer" className="rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">View</a>
                <a href={`/api/documents/${doc.id}/file?download=1`} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label={`Download ${doc.name}`}><Download className="h-3.5 w-3.5" /></a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800"><Building2 className="h-4 w-4 text-blue-700" /> Properties ({vault.properties.length})</h2>
        {vault.properties.length === 0 ? (
          <p className="py-4 text-xs text-gray-400">No property records.</p>
        ) : (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {vault.properties.map((p) => (
              <div key={p.id} className="rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-900">{p.propertyName}</p>
                <p className="text-xs text-purple-700">{p.propertyType}</p>
                {p.location && <p className="mt-1 text-xs text-gray-500">{p.location}</p>}
                {p.ownershipDetails && <p className="mt-1 text-xs text-gray-600">Ownership: {p.ownershipDetails}</p>}
                {p.registrationNumber && <p className="mt-1 text-xs text-gray-600">Registration: {p.registrationNumber}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800"><Wallet className="h-4 w-4 text-blue-700" /> Financial records ({vault.financialRecords.length})</h2>
        {vault.financialRecords.length === 0 ? (
          <p className="py-4 text-xs text-gray-400">No financial records.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-50">
            {vault.financialRecords.map((r) => (
              <li key={r.id} className="py-2.5">
                <p className="text-sm font-medium text-gray-800">{r.description}</p>
                <p className="text-xs text-gray-500">
                  {r.recordType.replace('_', ' ')} {r.institution ? `· ${r.institution}` : ''}
                  {r.outstandingAmount !== undefined ? ` · outstanding ₹${r.outstandingAmount.toLocaleString('en-IN')}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800"><ShieldCheck className="h-4 w-4 text-blue-700" /> Insurance ({vault.insuranceRecords.length})</h2>
        {vault.insuranceRecords.length === 0 ? (
          <p className="py-4 text-xs text-gray-400">No insurance policies.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-50">
            {vault.insuranceRecords.map((r) => (
              <li key={r.id} className="py-2.5">
                <p className="text-sm font-medium text-gray-800">{r.provider} · {r.policyType}</p>
                <p className="text-xs text-gray-500">
                  {r.policyNumber ? `Policy ${r.policyNumber}` : 'Policy number not recorded'}
                  {r.expiryDate ? ` · expires ${new Date(r.expiryDate).toLocaleDateString('en-IN')}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800"><PhoneCall className="h-4 w-4 text-blue-700" /> Emergency contacts ({vault.contacts.length})</h2>
        {vault.contacts.length === 0 ? (
          <p className="py-4 text-xs text-gray-400">No emergency contacts.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {vault.contacts.map((c) => (
              <li key={c.id} className="rounded-xl border border-gray-100 p-3">
                <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-500">{c.relationship}</p>
                {c.phone && <p className="mt-1 text-xs text-gray-700">{c.phone}</p>}
                {c.email && <p className="break-all text-xs text-gray-700">{c.email}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="rounded-xl bg-gray-100 px-4 py-3 text-[11px] leading-relaxed text-gray-500">
        This vault is shared read-only through an accepted invitation. You cannot edit or delete the
        owner&apos;s records; access can be revoked by the owner at any time.
      </p>
    </div>
  );
}
