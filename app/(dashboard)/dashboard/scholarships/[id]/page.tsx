'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  IndianRupee,
  CalendarDays,
  FileText,
  Loader2,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Globe,
  GraduationCap,
  ClipboardList,
} from 'lucide-react';
import type { Scholarship } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';
import { documentLabel } from '@/lib/eligibility';

export default function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sch, setSch] = useState<Scholarship | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [tracked, setTracked] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/scholarships').then((r) => r.json()),
      fetch('/api/scholarships/saved').then((r) => r.json()),
      fetch('/api/applications').then((r) => r.json()).catch(() => null),
    ])
      .then(([catalogue, savedRes, appsRes]) => {
        if (!active) return;
        const list = Array.isArray(catalogue.scholarships) ? (catalogue.scholarships as Scholarship[]) : [];
        const found = list.find((s) => s.id === id);
        if (!found) { setNotFound(true); return; }
        setSch(found);
        if (savedRes.success) {
          setSaved((savedRes.saved as { scholarshipId: string }[]).some((s) => s.scholarshipId === id));
        }
        if (appsRes?.success) {
          setTracked((appsRes.applications as { scholarshipId: string }[]).some((a) => a.scholarshipId === id));
        }
      })
      .catch(() => active && setNotFound(true));
    return () => { active = false; };
  }, [id]);

  async function trackApplication() {
    if (!sch || tracked) return;
    setTracking(true);
    setTrackError('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarshipId: sch.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTrackError(data.error ?? 'Could not start tracking this scholarship.');
        return;
      }
      setTracked(true);
    } catch {
      setTrackError('Network error. Please try again.');
    } finally {
      setTracking(false);
    }
  }

  async function toggleSaved() {
    if (!sch) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(
        saved
          ? `/api/scholarships/saved?scholarshipId=${encodeURIComponent(sch.id)}`
          : '/api/scholarships/saved',
        saved
          ? { method: 'DELETE' }
          : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scholarshipId: sch.id }) }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveError(data.error ?? 'Could not update your saved scholarships.');
        return;
      }
      setSaved((v) => !v);
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold text-gray-800">Scholarship not found</p>
        <p className="mt-1 text-xs text-gray-500">It may have been removed from the catalogue.</p>
        <Link href="/dashboard/scholarships" className="mt-3 inline-block text-xs font-semibold text-blue-700 hover:underline">
          ← Back to Explore Scholarships
        </Link>
      </div>
    );
  }

  if (!sch) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div>;
  }

  const verified = sch.verificationStatus === 'verified';
  const officialIsHttp = /^https?:\/\//i.test(sch.officialUrl);
  const sourceIsHttp = /^https?:\/\//i.test(sch.sourceUrl);
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const criteria: string[] = [];
  if (sch.familyIncomeCriteria) criteria.push(`Annual family income: ${sch.familyIncomeCriteria}`);
  else if (sch.eligibility.maxIncome !== undefined) criteria.push(`Annual family income: up to ₹${sch.eligibility.maxIncome.toLocaleString('en-IN')}`);
  if (sch.eligibility.minMarks !== undefined) criteria.push(`Minimum marks: ${sch.eligibility.minMarks}%`);
  if (sch.states.length) criteria.push(`State: ${sch.states.join(', ')}`);
  if (sch.educationLevel) criteria.push(`Education level: ${sch.educationLevel}`);
  if (sch.courses.length) criteria.push(`Eligible courses: ${sch.courses.join(', ')}`);
  if (sch.categoryRequirements.length) criteria.push(`Category: ${sch.categoryRequirements.join(', ')}`);
  if (sch.eligibility.gender?.length) criteria.push(`Gender: ${sch.eligibility.gender.join(', ')}`);
  for (const extra of sch.eligibility.extraRequirements ?? []) criteria.push(extra);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/scholarships" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Explore Scholarships
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={trackApplication}
            disabled={tracking || tracked}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors ${
              tracked
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
            } disabled:opacity-60`}
          >
            {tracking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardList className="h-3.5 w-3.5" />}
            {tracked ? 'In My Applications' : 'Track application'}
          </button>
          <button
            onClick={toggleSaved}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors ${
              saved ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-300 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700'
            } disabled:opacity-60`}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
            {saved ? 'Saved' : 'Save scholarship'}
          </button>
        </div>
      </div>
      {(saveError || trackError) && (
        <p className="text-xs text-red-600">{trackError || saveError}</p>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${getStatusColor(sch.status)} capitalize`}>{sch.status.replace('-', ' ')}</span>
              <span className={`badge ${verified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {verified ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <ShieldAlert className="mr-1 h-3 w-3" />}
                {verified ? 'Verified listing' : 'Needs verification'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{sch.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500"><Building2 className="h-4 w-4" /> {sch.provider}</p>
          </div>
          <div className="rounded-xl bg-blue-50 px-5 py-3">
            <p className="flex items-center gap-1.5 text-xl font-extrabold text-blue-900"><IndianRupee className="h-5 w-5 shrink-0" /> {sch.amount}</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-gray-600">{sch.description}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-medium text-gray-400">Applications open</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800"><CalendarDays className="h-4 w-4 text-gray-400" /> {fmt(sch.openDate)}</p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-medium text-gray-400">Deadline</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800"><CalendarDays className="h-4 w-4 text-gray-400" /> {fmt(sch.deadline)}</p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-medium text-gray-400">Official application link</p>
            {verified && officialIsHttp ? (
              <a href={sch.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline">
                Apply on official portal <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="mt-1 text-sm text-gray-400">Not available until verified</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800"><GraduationCap className="h-4 w-4 text-blue-700" /> Eligibility criteria</h2>
          {criteria.length === 0 ? (
            <p className="text-xs text-gray-400">The provider has not published machine-readable criteria. Check the official source.</p>
          ) : (
            <ul className="space-y-2">
              {criteria.map((c) => (
                <li key={c} className="flex items-start gap-2 text-xs leading-relaxed text-gray-600">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" /> {c}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 rounded-xl bg-gray-50 p-3">
            <p className="text-[11px] leading-relaxed text-gray-500">
              <b>Benefits:</b> {sch.amount}. {sch.description}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800"><FileText className="h-4 w-4 text-blue-700" /> Required documents</h2>
          {sch.requiredDocuments.length === 0 ? (
            <p className="text-xs text-gray-400">Not specified in the listing.</p>
          ) : (
            <ul className="space-y-2">
              {sch.requiredDocuments.map((doc) => (
                <li key={doc} className="rounded-xl border border-gray-100 px-4 py-2.5 text-sm text-gray-700">{documentLabel(doc)}</li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/documents" className="mt-3 inline-block text-xs font-semibold text-blue-700 hover:underline">
            Manage documents →
          </Link>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-gray-800">Application procedure</h2>
        {sch.applicationInstructions ? (
          <p className="whitespace-pre-line text-xs leading-relaxed text-gray-600">{sch.applicationInstructions}</p>
        ) : (
          <p className="text-xs leading-relaxed text-gray-500">
            The provider has not supplied step-by-step instructions for this listing. Use the official
            portal below and follow the provider&apos;s published process.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800"><Globe className="h-4 w-4 text-blue-700" /> Source and verification</h2>
        <dl className="grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-gray-400">Information last verified</dt>
            <dd className="mt-0.5 font-semibold text-gray-800">
              {sch.lastVerifiedAt ? new Date(sch.lastVerifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not verified yet — needs verification'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Official source</dt>
            <dd className="mt-0.5 break-all font-semibold text-gray-800">
              {sourceIsHttp ? (
                <a href={sch.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">{sch.sourceUrl}</a>
              ) : (
                'Not provided'
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Always confirm amounts, dates and eligibility on the provider&apos;s official portal before applying.
          ClaimWise does not invent scholarship information.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/eligibility" className="btn-primary">Check my eligibility</Link>
        <Link href="/dashboard/saved-scholarships" className="btn-secondary">View saved scholarships</Link>
      </div>
    </div>
  );
}
