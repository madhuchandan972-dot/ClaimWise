'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Target,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ChevronDown,
  Loader2,
  Lightbulb,
  AlertTriangle,
  Search,
  Info,
} from 'lucide-react';
import type { EligibilityResult, User } from '@/lib/types';

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Jammu & Kashmir', 'Ladakh', 'Other',
];
const LEVELS = ['10th', '12th', 'Diploma', 'Undergraduate', 'Postgraduate', 'PhD'];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const GENDERS = ['Female', 'Male', 'Other', 'Prefer not to say'];

const GROUPS = [
  { status: 'eligible', title: 'Eligible', icon: CheckCircle2, cls: 'text-green-600', desc: 'Every checkable requirement passed.' },
  { status: 'possibly-eligible', title: 'Possibly eligible', icon: HelpCircle, cls: 'text-amber-600', desc: 'Nothing failed, but some information is unconfirmed.' },
  { status: 'more-info-required', title: 'More information required', icon: Info, cls: 'text-blue-600', desc: 'There is not enough profile information to evaluate this listing.' },
  { status: 'not-eligible', title: 'Not eligible', icon: XCircle, cls: 'text-red-600', desc: 'At least one requirement excludes this profile.' },
] as const;

interface FormState {
  state: string;
  educationLevel: string;
  course: string;
  category: string;
  gender: string;
  familyIncome: string;
  marksPercentage: string;
}

const EMPTY: FormState = {
  state: '', educationLevel: '', course: '', category: '', gender: '', familyIncome: '', marksPercentage: '',
};

export default function EligibilityPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [results, setResults] = useState<EligibilityResult[] | null>(null);
  const [catalogueEmpty, setCatalogueEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    const res = await fetch('/api/eligibility');
    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.error ?? 'Could not run the eligibility check.');
      setResults([]);
      return;
    }
    setResults(data.results as EligibilityResult[]);
    setCatalogueEmpty(data.catalogueEmpty === true);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/eligibility').then((r) => r.json()),
    ])
      .then(([profileRes, eligibilityRes]) => {
        if (!active) return;
        if (profileRes.success) {
          const p = profileRes.profile as User;
          setForm({
            state: p.state ?? '',
            educationLevel: p.educationLevel ?? '',
            course: p.course ?? '',
            category: p.category ?? '',
            gender: p.gender ?? '',
            familyIncome: p.familyIncome ? String(p.familyIncome) : '',
            marksPercentage: p.marksPercentage !== undefined ? String(p.marksPercentage) : '',
          });
        }
        if (eligibilityRes.success) {
          setResults(eligibilityRes.results as EligibilityResult[]);
          setCatalogueEmpty(eligibilityRes.catalogueEmpty === true);
        } else {
          setError(eligibilityRes.error ?? 'Could not run the eligibility check.');
          setResults([]);
        }
      })
      .catch(() => active && setError('Network error while loading your eligibility.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setNotice('');
  }

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const income = Number(form.familyIncome.replace(/[,\s₹]/g, ""));
      if (form.familyIncome.trim() && (!Number.isFinite(income) || income < 0)) {
        setError('Enter a valid annual family income.');
        return;
      }
      const marks = form.marksPercentage.trim() ? Number(form.marksPercentage) : undefined;
      if (marks !== undefined && (!Number.isFinite(marks) || marks < 0 || marks > 100)) {
        setError('Marks must be between 0 and 100.');
        return;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: form.state,
          educationLevel: form.educationLevel,
          course: form.course,
          category: form.category,
          gender: form.gender,
          familyIncome: form.familyIncome.trim() ? Math.round(income) : 0,
          ...(marks !== undefined ? { marksPercentage: marks } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Could not save your details.');
        return;
      }
      await loadResults();
      setNotice('Your details were saved and matched against the current catalogue.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const counts = { eligible: 0, 'possibly-eligible': 0, 'more-info-required': 0, 'not-eligible': 0 };
  (results ?? []).forEach((r) => { if (r.status in counts) counts[r.status as keyof typeof counts]++; });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Eligibility Checker</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Enter your education and personal details. ClaimWise compares them with each listing&apos;s
          published criteria and explains every result — including what is missing.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <p className="text-xs text-green-700">{notice}</p>
        </div>
      )}

      <form onSubmit={check} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800"><Target className="h-4 w-4 text-blue-700" /> Your details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="eligibilityState" className="label">Home state</label>
            <select id="eligibilityState" value={form.state} onChange={(e) => set('state', e.target.value)} className="input-field">
              <option value="">Select…</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="eligibilityLevel" className="label">Education level</label>
            <select id="eligibilityLevel" value={form.educationLevel} onChange={(e) => set('educationLevel', e.target.value)} className="input-field">
              <option value="">Select…</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="eligibilityCourse" className="label">Course</label>
            <input id="eligibilityCourse" value={form.course} onChange={(e) => set('course', e.target.value)} maxLength={120} className="input-field" placeholder="e.g. B.Tech Computer Science" />
          </div>
          <div>
            <label htmlFor="eligibilityCategory" className="label">Social category</label>
            <select id="eligibilityCategory" value={form.category} onChange={(e) => set('category', e.target.value)} className="input-field">
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="eligibilityIncome" className="label">Annual family income (₹)</label>
            <input id="eligibilityIncome" inputMode="numeric" value={form.familyIncome} onChange={(e) => set('familyIncome', e.target.value)} className="input-field" placeholder="e.g. 250000" />
          </div>
          <div>
            <label htmlFor="eligibilityGender" className="label">Gender</label>
            <select id="eligibilityGender" value={form.gender} onChange={(e) => set('gender', e.target.value)} className="input-field">
              <option value="">Select…</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="eligibilityMarks" className="label">Last exam marks (%) <span className="font-normal text-gray-400">(optional)</span></label>
            <input id="eligibilityMarks" inputMode="decimal" value={form.marksPercentage} onChange={(e) => set('marksPercentage', e.target.value)} className="input-field" placeholder="e.g. 88" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary mt-4 w-full sm:w-auto">
          {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Checking…</>) : (<><Search className="h-4 w-4" /> Save details & check eligibility</>)}
        </button>
        <p className="mt-2 text-[11px] text-gray-400">These details are saved to your account and can be changed any time.</p>
      </form>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-700" /></div>
      ) : catalogueEmpty || (results?.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center">
          <Search className="mx-auto h-9 w-9 text-gray-300" />
          <p className="mt-3 text-sm font-semibold text-gray-700">No scholarships to check yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-500">
            The catalogue is empty. Once verified scholarships are added to the database, your saved
            details will be matched against them automatically.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {GROUPS.map((g) => (
              <div key={g.status} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50"><g.icon className={`h-5 w-5 ${g.cls}`} /></span>
                <div><p className="text-2xl font-bold text-gray-900">{counts[g.status]}</p><p className="text-xs font-medium text-gray-500">{g.title}</p></div>
              </div>
            ))}
          </div>

          <div className="space-y-7">
            {GROUPS.map((g) => {
              const group = (results ?? []).filter((r) => r.status === g.status);
              if (group.length === 0) return null;
              return (
                <section key={g.status}>
                  <div className="mb-3 flex items-center gap-2">
                    <g.icon className={`h-4 w-4 ${g.cls}`} />
                    <h2 className="text-sm font-bold text-gray-800">{g.title}</h2>
                    <span className="hidden text-xs text-gray-400 sm:inline">· {g.desc}</span>
                  </div>
                  <div className="space-y-3">
                    {group.map((r) => {
                      const isOpen = open === r.scholarshipId;
                      return (
                        <article key={r.scholarshipId} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                          <button onClick={() => setOpen(isOpen ? null : r.scholarshipId)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50" aria-expanded={isOpen}>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">{r.scholarshipName}</h3>
                              <p className="mt-0.5 text-xs text-gray-500">
                                {r.reasons.length} reason{r.reasons.length === 1 ? '' : 's'}
                                {r.missingInfo.length > 0 ? ` · ${r.missingInfo.length} item${r.missingInfo.length === 1 ? '' : 's'} to confirm` : ''}
                              </p>
                            </div>
                            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                              <p className="mb-2 text-xs font-bold text-gray-700">Why this result</p>
                              {r.reasons.length === 0 ? (
                                <p className="text-xs text-gray-500">No requirement could be evaluated with the current information.</p>
                              ) : (
                                <ul className="space-y-2">
                                  {r.reasons.map((reason, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-600">
                                      {r.status === 'not-eligible' ? <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />}
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {r.missingInfo.length > 0 && (
                                <>
                                  <p className="mb-2 mt-4 flex items-center gap-1.5 text-xs font-bold text-gray-700"><Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Missing information / next steps</p>
                                  <ul className="space-y-1.5">
                                    {r.missingInfo.map((m, i) => (
                                      <li key={i} className="text-xs leading-relaxed text-gray-600">• {m}</li>
                                    ))}
                                  </ul>
                                </>
                              )}

                              <Link href={`/dashboard/scholarships/${r.scholarshipId}`} className="btn-secondary mt-4 !py-2 text-xs">View scholarship details</Link>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      <p className="rounded-xl bg-gray-100 px-4 py-3 text-[11px] leading-relaxed text-gray-500">
        Results are rule-based and come only from the criteria stored in each listing. Always verify with
        the provider&apos;s official portal before applying.
      </p>
    </div>
  );
}
