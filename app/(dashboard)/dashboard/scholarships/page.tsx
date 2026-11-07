'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  IndianRupee,
  CalendarDays,
  Building2,
  Info,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { Scholarship } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';

const LEVELS = ['', '10th', '12th', 'Diploma', 'Undergraduate', 'Postgraduate', 'PhD'];
const CATEGORIES = ['', 'General', 'OBC', 'SC', 'ST', 'EWS'];
const TYPES = ['', 'Merit', 'Means-cum-merit', 'Minority', 'Girls', 'State', 'Central', 'Technical'];

export default function ScholarshipsPage() {
  const [all, setAll] = useState<Scholarship[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [level, setLevel] = useState('');
  const [course, setCourse] = useState('');
  const [category, setCategory] = useState('');
  const [income, setIncome] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/scholarships')
      .then(async (r) => {
        const data = await r.json();
        if (!active) return;
        if (!data.success) {
          setError(data.error ?? 'The scholarship catalogue is temporarily unavailable.');
          setAll([]);
          return;
        }
        setAll(data.scholarships as Scholarship[]);
      })
      .catch(() => active && setError('Network error while loading scholarships.'));
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const incomeValue = income.trim() ? Number(income.replace(/,/g, '')) : null;
    return (all ?? []).filter((s) => {
      const matchQ = query
        ? [s.name, s.provider, s.description, s.scholarshipType].some((f) => f.toLowerCase().includes(query))
        : true;
      const matchState = stateFilter
        ? s.states.length === 0 || s.states.some((x) => x.toLowerCase().includes(stateFilter.toLowerCase()))
        : true;
      const matchLevel = level ? !s.educationLevel || s.educationLevel.toLowerCase() === level.toLowerCase() : true;
      const matchCourse = course
        ? s.courses.length === 0 || s.courses.some((c) => c.toLowerCase().includes(course.toLowerCase()))
        : true;
      const matchCategory = category
        ? s.categoryRequirements.length === 0 || s.categoryRequirements.some((c) => c.toLowerCase() === category.toLowerCase())
        : true;
      const matchIncome = incomeValue !== null && Number.isFinite(incomeValue)
        ? s.maxIncome === undefined || s.maxIncome === null || incomeValue <= s.maxIncome
        : true;
      const matchType = type ? s.scholarshipType.toLowerCase().includes(type.toLowerCase()) : true;
      return matchQ && matchState && matchLevel && matchCourse && matchCategory && matchIncome && matchType;
    });
  }, [all, q, stateFilter, level, course, category, income, type]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function daysLeft(deadline: string): number | null {
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 ? Math.ceil(diff / 86_400_000) : null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Explore Scholarships</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Search verified listings by state, education level, course, category, income and type.
            Every listing shows its verification status.
          </p>
        </div>
        <Link href="/dashboard/eligibility" className="btn-secondary !py-2.5 text-sm">
          <CheckCircle2 className="h-4 w-4" /> Check eligibility
        </Link>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-gray-100 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <p className="text-[11px] leading-relaxed text-gray-500">
          ClaimWise does not invent scholarships. The catalogue starts empty; entries are added by an
          administrator from official government or provider sources. Listings marked
          <b> Needs verification</b> are not confirmed against a live official source.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, provider or keyword…" className="input-field pl-10" aria-label="Search scholarships" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} placeholder="State (e.g. Karnataka)" className="input-field" aria-label="Filter by state" />
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-field" aria-label="Filter by education level">
            {LEVELS.map((l) => <option key={l} value={l}>{l || 'All education levels'}</option>)}
          </select>
          <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Course (e.g. B.Tech)" className="input-field" aria-label="Filter by course" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" aria-label="Filter by category">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All categories'}</option>)}
          </select>
          <input value={income} onChange={(e) => setIncome(e.target.value)} inputMode="numeric" placeholder="Annual family income (₹)" className="input-field" aria-label="Filter by family income" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="input-field" aria-label="Filter by scholarship type">
            {TYPES.map((t) => <option key={t} value={t}>{t || 'All scholarship types'}</option>)}
          </select>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <SlidersHorizontal className="h-3 w-3" /> {filtered.length} listing{filtered.length === 1 ? '' : 's'} shown
        </p>
      </div>

      {all === null ? (
        <div className="flex h-48 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
        </div>
      ) : all.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <Search className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-semibold text-gray-700">The scholarship catalogue has not been loaded yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-500">
            No fake listings are inserted. An administrator can add verified scholarships to the
            <code className="mx-1 rounded bg-gray-100 px-1">scholarships</code> table, including the
            official source URL and last-verified date.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm font-semibold text-gray-700">No scholarships match your filters</p>
          <p className="mt-1 text-xs text-gray-500">Try clearing a filter or searching for a different course.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((s) => {
            const dl = daysLeft(s.deadline);
            const verified = s.verificationStatus === 'verified';
            return (
              <Link key={s.id} href={`/dashboard/scholarships/${s.id}`} className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:shadow-md">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold leading-snug text-gray-900 group-hover:text-blue-700">{s.name}</h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500"><Building2 className="h-3.5 w-3.5" /> {s.provider}</p>
                  </div>
                  <span className={`badge shrink-0 ${getStatusColor(s.status)} capitalize`}>{s.status.replace('-', ' ')}</span>
                </div>

                <div className="mb-3 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5">
                  <IndianRupee className="h-4 w-4 text-blue-700" />
                  <p className="text-sm font-bold text-blue-900">{s.amount}</p>
                </div>

                <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">{s.description}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.educationLevel && <span className="badge bg-purple-50 text-purple-700">{s.educationLevel}</span>}
                  {s.categoryRequirements.slice(0, 3).map((c) => <span key={c} className="badge bg-gray-100 text-gray-600">{c}</span>)}
                  {s.scholarshipType && <span className="badge bg-gray-100 text-gray-600">{s.scholarshipType}</span>}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-50 pt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> Closes {formatDate(s.deadline)}
                    {dl !== null && <span className={`font-semibold ${dl <= 7 ? 'text-red-600' : 'text-gray-600'}`}>({dl}d left)</span>}
                  </span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${verified ? 'text-green-700' : 'text-amber-700'}`}>
                    {verified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                    {verified ? 'Verified' : 'Needs verification'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
