'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Target,
  FolderOpen,
  FileInput,
  ClipboardCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { Scholarship, Document, EligibilityResult } from '@/lib/types';

interface Profile { name?: string; email: string; phone?: string; dob?: string; gender?: string; state?: string; district?: string; category?: string; familyIncome?: number; college?: string; course?: string; year?: string; marksPercentage?: number; marksExam?: string; }

interface MappedField {
  portalField: string;
  source: string;
  value: string;
  approved: boolean;
}

export default function AssistantWorkflowPage({ params }: { params: Promise<{ scholarshipId: string }> }) {
  const { scholarshipId } = use(params);
  const [step, setStep] = useState(0);
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mapped, setMapped] = useState<MappedField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/scholarships').then((r) => r.json()),
      fetch('/api/documents').then((r) => r.json()),
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/eligibility').then((r) => r.json()),
    ])
      .then(([sch, docs, prof, elig]) => {
        const found = (sch.scholarships as Scholarship[]).find((s) => s.id === scholarshipId);
        if (!found) { setError('Scholarship not found.'); return; }
        setScholarship(found);
        setDocuments(docs.success ? (docs.documents as Document[]) : []);
        setProfile(prof.success ? prof.profile as Profile : null);
        setEligibility(
          (elig.results as EligibilityResult[]).find((r) => r.scholarshipId === scholarshipId) ?? null
        );
      })
      .catch(() => setError('Could not load the assistant session.'))
      .finally(() => setLoading(false));
  }, [scholarshipId]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }
  if (error || !scholarship) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        {error ?? 'Something went wrong.'}
      </div>
    );
  }

  const owned = new Set<string>(documents.map((d) => d.type));
  const missingDocs = scholarship.requiredDocuments.filter((t) => t !== 'Other' && !owned.has(t));

  const STEPS = [
    { label: 'Eligibility check', icon: Target },
    { label: 'Document readiness', icon: FolderOpen },
    { label: 'Field preparation', icon: FileInput },
    { label: 'Review & portal', icon: ClipboardCheck },
  ];

  const income = profile?.familyIncome ? `₹${profile.familyIncome.toLocaleString('en-IN')}` : '';

  function buildMapping(): MappedField[] {
    const p = profile;
    if (!p) return [];
    const fields: [string, string, string][] = [
      ['Candidate full name', 'Profile → name', p.name ?? ''],
      ['Email address', 'Profile → email', p.email],
      ['Mobile number', 'Profile → phone', p.phone ?? ''],
      ['Date of birth', 'Profile → dob', p.dob ?? ''],
      ['Gender', 'Profile → gender', p.gender ?? ''],
      ['Home state', 'Profile → state', p.state ?? ''],
      ['District', 'Profile → district', p.district ?? ''],
      ['Social category', 'Profile → category', p.category ?? ''],
      ['Annual family income', 'Profile → familyIncome', income],
      ['College / Institution', 'Profile → college', p.college ?? ''],
      ['Course', 'Profile → course', p.course ?? ''],
      ['Year of study', 'Profile → year', p.year ?? ''],
      ['Last exam percentage', 'Profile → marksPercentage', p.marksPercentage ? `${p.marksPercentage}%` : ''],
    ];
    return fields
      .filter((f) => f[2])
      .map(([portalField, source, value]) => ({ portalField, source, value, approved: false }));
  }

  const allApproved = mapped.length > 0 && mapped.every((m) => m.approved);

  function openMockPortal() {
    if (!scholarship) return;
    // Transfer the approved (student-reviewed) field set + application context
    sessionStorage.setItem(
      'cw_mock_portal',
      JSON.stringify({
        scholarship: scholarship.name,
        scholarshipId: scholarship.id,
        fields: mapped.filter((m) => m.approved),
        isMock: true,
      })
    );
    window.location.href = `/dashboard/assistant/mock-portal?app=${encodeURIComponent(scholarship.id)}`;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/assistant" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Assistant
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="warning">Demonstration workflow</Badge>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{scholarship.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{scholarship.provider} · {scholarship.amount}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Closes on</p>
            <p className="text-sm font-semibold text-gray-800">
              {new Date(scholarship.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setStep(i)}
              className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-colors ${
                i === step ? 'bg-blue-600 text-white shadow-sm' : i < step ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-400'
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="text-[10px] font-semibold leading-tight sm:text-xs">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* ── Step 1: Eligibility ── */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Step 1 · Eligibility check</h2>
            {eligibility === null ? (
              <p className="text-sm text-gray-500">Running the eligibility engine…</p>
            ) : (
              <>
                <span className={`badge ${eligibility.status === 'eligible' ? 'bg-green-50 text-green-700' : eligibility.status === 'possibly-eligible' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'} capitalize`}>
                  {eligibility.status.replace('-', ' ')}
                </span>
                <ul className="space-y-2">
                  {eligibility.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-gray-600">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${eligibility.status === 'not-eligible' ? 'bg-red-400' : 'bg-blue-400'}`} />
                      {r}
                    </li>
                  ))}
                </ul>
                {eligibility.missingInfo.length > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                    <p className="mb-1 text-xs font-bold text-amber-800">To confirm, add:</p>
                    {eligibility.missingInfo.map((m, i) => (
                      <p key={i} className="text-xs text-amber-700">· {m}</p>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} disabled={eligibility.status === 'not-eligible'} className="btn-primary !py-2.5 text-xs">
                    Continue to documents <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  {eligibility.status === 'not-eligible' && (
                    <p className="text-xs text-gray-400 self-center">Fix the blockers above and re-check eligibility first.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 2: Documents ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Step 2 · Document readiness</h2>
            <p className="text-xs text-gray-500">Required documents for {scholarship.name}:</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {scholarship.requiredDocuments.map((t) => {
                const have = owned.has(t);
                const isProcessed = documents.find((d) => d.type === t)?.status === 'processed';
                return (
                  <li key={t} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${have ? 'border-gray-100' : 'border-dashed border-amber-300 bg-amber-50'}`}>
                    <span className="text-xs font-medium text-gray-700">{t.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</span>
                    {have ? (
                      <Badge variant={isProcessed ? 'success' : 'info'} dot>{isProcessed ? 'Ready' : 'In vault'}</Badge>
                    ) : (
                      <Badge variant="warning" dot>Missing</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
            {missingDocs.length > 0 ? (
              <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p className="text-xs text-blue-700">
                  {missingDocs.length} document{missingDocs.length > 1 ? 's' : ''} missing. You can continue preparing fields,
                  but the form cannot be finalised until the full set is in your vault.{' '}
                  <Link href="/dashboard/documents" className="font-semibold underline">Open the vault →</Link>
                </p>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-xs font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" /> All required documents are in your vault.
              </p>
            )}
            <button onClick={() => setStep(2)} className="btn-primary !py-2.5 text-xs">
              Continue to field preparation <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Step 3: Field preparation ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Step 3 · Field preparation</h2>
            <p className="text-xs leading-relaxed text-gray-500">
              These are the portal fields ClaimWise would prepare, using only your approved profile
              data. Nothing is shared with any portal yet. Approve each row below.
            </p>
            {mapped.length === 0 && <p className="text-xs text-gray-400">Generating from your profile…</p>}
            {mapped.length === 0 && profile && (
              <button onClick={() => { const m = buildMapping(); setMapped(m); }} className="btn-secondary !py-2.5 text-xs">
                Prepare {scholarship.name} fields
              </button>
            )}
            {mapped.length > 0 && (
              <>
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">Portal field</th>
                        <th className="px-4 py-2.5 font-semibold">Prepared value</th>
                        <th className="px-4 py-2.5 font-semibold">Source</th>
                        <th className="px-4 py-2.5 text-center font-semibold">Approve</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {mapped.map((m, i) => (
                        <tr key={m.portalField}>
                          <td className="px-4 py-2.5 font-medium text-gray-700">{m.portalField}</td>
                          <td className="px-4 py-2.5">
                            <input
                              value={m.value}
                              onChange={(e) => setMapped((p) => p.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                              className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                              aria-label={`Edit value for ${m.portalField}`}
                            />
                          </td>
                          <td className="px-4 py-2.5 text-gray-400">{m.source}</td>
                          <td className="px-4 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={m.approved}
                              onChange={(e) => setMapped((p) => p.map((x, j) => (j === i ? { ...x, approved: e.target.checked } : x)))}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600"
                              aria-label={`Approve ${m.portalField}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={() => setStep(3)} disabled={!allApproved} className="btn-primary !py-2.5 text-xs" title={allApproved ? '' : 'Approve every field to continue'}>
                  Continue to review <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {profile && mapped.length === 0 && !profile.name && (
              <p className="text-xs text-amber-600">
                Your profile has limited data. <Link href="/dashboard/profile" className="font-semibold underline">Complete your profile</Link> first.
              </p>
            )}
          </div>
        )}

        {/* ── Step 4: Review & portal ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Step 4 · Final review</h2>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs leading-relaxed text-gray-600">
                <b>{mapped.filter((m) => m.approved).length} approved fields</b> are ready for the
                portal. In the real product, ClaimWise supports supported application portals with
                field-level autofill — you would personally handle the login, OTP, CAPTCHA and final
                submission. Here we use a <b>mock portal</b> to demonstrate the experience safely.
              </p>
            </div>
            <ul className="list-inside list-decimal space-y-1 rounded-xl border border-gray-100 px-4 py-3 text-xs leading-relaxed text-gray-600">
              <li>Review the pre-filled fields one final time on the mock portal.</li>
              <li>You (the student) click the confirm-submission button yourself.</li>
              <li>Only after your confirmation is the application record marked <b>Submitted</b>.</li>
            </ul>
            <button onClick={openMockPortal} className="btn-primary !py-2.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" /> Open mock scholarship portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
