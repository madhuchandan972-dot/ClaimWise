'use client';

// ============================================================
// ClaimWise — Emergency Information Card (print / PDF)
//
// A one-page, print-optimised summary generated from the user's
// own vault: identity, emergency contacts, insurance, property
// and financial obligations. Uses the browser's Print → "Save
// as PDF" (zero server rendering cost, perfect type control).
// Everything shown here already lives in the private vault —
// the page stores nothing, prints nothing automatically, and
// switches to a clean paper layout inside @media print.
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Loader2, AlertTriangle } from 'lucide-react';

interface CardData {
  generatedAt: string;
  person: {
    name: string;
    dob?: string;
    age?: number;
    gender?: string;
    phone?: string;
    state?: string;
    district?: string;
  };
  contacts: { name: string; relationship?: string; phone?: string; email?: string }[];
  insurance: { label: string; policyNumber?: string; policyholder?: string; expiry?: string }[];
  properties: { label: string; type?: string; location?: string; registration?: string }[];
  obligations: { label: string; outstanding?: string; due?: string }[];
}

export default function EmergencyCardPage() {
  const [data, setData] = useState<CardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/emergency-card')
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok || !body.success) {
          setError(body.error ?? 'Could not load the emergency card.');
          return;
        }
        setData(body as CardData);
      })
      .catch(() => setError('Network error while loading the emergency card.'));
  }, []);

  return (
    <div className="space-y-6">
      {/* Screen-only header */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard" className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to vault
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Emergency Information Card</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            One page for the family folder or the fridge door. Print it or choose “Save as PDF” in the print dialog.
          </p>
        </div>
        <button onClick={() => window.print()} className="btn-primary w-full sm:w-auto" disabled={!data}>
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
      </div>

      {error && (
        <div className="no-print flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {!data && !error && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        </div>
      )}

      {data && (
        <div className="card-sheet rounded-2xl border border-gray-200 bg-white p-6 shadow-sm print:shadow-none print:rounded-none print:border-0 sm:p-8">
          <style jsx global>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* Card header */}
          <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-900">ClaimWise · Emergency information card</p>
              <h2 className="mt-1 text-2xl font-black text-gray-900">{data.person.name}</h2>
              <p className="mt-1 text-xs text-gray-600">
                {[
                  data.person.dob ? `DOB ${data.person.dob}` : undefined,
                  data.person.age !== undefined ? `${data.person.age} yrs` : undefined,
                  data.person.gender && data.person.gender !== 'Prefer not to say' ? data.person.gender : undefined,
                ].filter(Boolean).join(' · ')}
              </p>
              <p className="text-xs text-gray-600">
                {[
                  data.person.district,
                  data.person.state,
                ].filter(Boolean).join(', ')}
                {data.person.phone ? ` · Ph ${data.person.phone}` : ''}
              </p>
            </div>
            <div className="text-right text-[10px] text-gray-400">
              <p className="font-semibold uppercase tracking-wider text-gray-500">Generated</p>
              <p>{new Date(data.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Contacts — the most emergency-relevant block, always on top */}
          <CardSection title="Emergency contacts" count={data.contacts.length}>
            {data.contacts.length === 0 ? (
              <Empty text="No emergency contacts added yet — add them in the vault." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.contacts.map((c, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 px-3 py-2">
                    <p className="text-sm font-bold text-gray-900">
                      {c.name}
                      {c.relationship && <span className="ml-1.5 text-[11px] font-semibold text-gray-500">({c.relationship})</span>}
                    </p>
                    <p className="text-base font-black tracking-wide text-blue-900">{c.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </CardSection>

          <CardSection title="Insurance policies" count={data.insurance.length}>
            <Table
              head={['Policy', 'Policy number', 'Expiry']}
              rows={data.insurance.map((i) => [i.label, i.policyNumber || '—', i.expiry || '—'])}
              empty="No insurance recorded yet."
            />
          </CardSection>

          <CardSection title="Property" count={data.properties.length}>
            <Table
              head={['Property', 'Location', 'Registration']}
              rows={data.properties.map((p) => [
                [p.label, p.type && `(${p.type})`].filter(Boolean).join(' '),
                p.location || '—',
                p.registration || '—',
              ])}
              empty="No property recorded yet."
            />
          </CardSection>

          <CardSection title="Financial obligations" count={data.obligations.length}>
            <Table
              head={['Obligation', 'Outstanding', 'Due']}
              rows={data.obligations.map((o) => [o.label, o.outstanding || '—', o.due || '—'])}
              empty="No financial obligations recorded."
            />
          </CardSection>

          <p className="mt-6 border-t border-dashed border-gray-300 pt-3 text-[10px] leading-relaxed text-gray-400">
            This card summarises the private ClaimWise vault of {data.person.name} and only shows records stored by the
            owner. The original documents remain the authoritative source — verify numbers against the actual documents
            before acting on them in a real emergency.
          </p>
        </div>
      )}
    </div>
  );
}

function CardSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
        {title}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{count}</span>
      </h3>
      {children}
    </section>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          {head.map((h, idx) => (
            <th key={idx} className="border-b border-gray-300 px-2 py-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={head.length} className="px-2 py-2 text-gray-400 italic">{empty}</td>
          </tr>
        ) : (
          rows.map((row, i) => (
            <tr key={i} className="break-inside-avoid">
              {row.map((cell, j) => (
                <td key={j} className="border-b border-gray-100 px-2 py-1.5 align-top text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs italic text-gray-400">{text}</p>;
}
