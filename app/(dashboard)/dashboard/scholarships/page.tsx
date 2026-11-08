'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  RefreshCw,
  ExternalLink,
  Radio,
  Zap,
} from 'lucide-react';
import type { Scholarship } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';

const LEVELS = ['', '10th', '12th', 'Diploma', 'Undergraduate', 'Postgraduate', 'PhD'];
const CATEGORIES = ['', 'General', 'OBC', 'SC', 'ST', 'EWS'];
const TYPES = ['', 'Merit', 'Means-cum-merit', 'Minority', 'Girls', 'State', 'Central', 'Technical'];

const AUTO_FETCH_COOLDOWN_MS = 5 * 60 * 1000;

type LiveState = 'idle' | 'running' | 'done' | 'error';

interface CatalogueLoad {
  items: Scholarship[];
  catalogueEmpty: boolean;
}

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

  const [liveState, setLiveState] = useState<LiveState>('idle');
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const runningRef = useRef(false);

  const loadCatalogue = useCallback(async (): Promise<CatalogueLoad> => {
    const res = await fetch('/api/scholarships');
    const data = await res.json();
    if (!data.success) {
      setError(data.error ?? 'The scholarship catalogue is temporarily unavailable.');
      setAll([]);
      return {
        items: [],
        catalogueEmpty: true,
      };
    }
    setError('');
    const items = (data.scholarships ?? []) as Scholarship[];
    setAll(items);
    return {
      items,
      catalogueEmpty: Boolean(data.catalogueEmpty) || items.length === 0,
    };
  }, []);

  // LIVE pipeline — runs the grounded Gemini search, then reloads the
  // catalogue so the listings on the page are a moment old at most.
  const runLiveSearch = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setLiveState('running');
    setLiveMessage(null);
    try {
      const res = await fetch('/api/scholarships/live', { method: 'POST' });
      const data = await res.json();
      try {
        localStorage.setItem('cw_live_attempt_at', String(Date.now()));
      } catch {
        /* private mode — the auto-fetch guard just no-ops */
      }
      if (!data.success) {
        setLiveState('error');
        setLiveMessage(data.error ?? 'The live search could not run.');
        return;
      }
      if ((data.added ?? 0) > 0) {
        await loadCatalogue();
      }
      setLiveState('done');
      setLiveMessage(data.message ?? 'Live catalogue refreshed.');
    } catch {
      try {
        localStorage.setItem('cw_live_attempt_at', String(Date.now()));
      } catch {
        /* ignore */
      }
      setLiveState('error');
      setLiveMessage('Network error while running the live search.');
    } finally {
      runningRef.current = false;
    }
  }, [loadCatalogue]);

  useEffect(() => {
    let active = true;
    loadCatalogue()
      .then((result) => {
        if (!active) return;
        // Auto-run the live search once when the catalogue is empty so
        // the page is never a dead end. Guarded by a 5-minute cooldown
        // so repeated visits do not consume the AI quota.
        if (result.items.length > 0) return;
        let last = 0;
        try {
          last = Number(localStorage.getItem('cw_live_auto_at') ?? 0);
        } catch {
          /* ignore */
        }
        if (Date.now() - last < AUTO_FETCH_COOLDOWN_MS) return;
        try {
          localStorage.setItem('cw_live_auto_at', String(Date.now()));
        } catch {
          /* ignore */
        }
        runLiveSearch();
      })
      .catch(() => {
        if (active) setError('Network error while loading scholarships.');
      });
    return () => {
      active = false;
    };
  }, [loadCatalogue, runLiveSearch]);

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

  // Live band statistics
  const stats = useMemo(() => {
    const items = all ?? [];
    const open = items.filter((s) => s.status === 'open').length;
    const closing = items.filter((s) => s.status === 'closing-soon').length;
    const live = items.filter((s) => s.source === 'live').length;
    const verified = items.filter((s) => s.verificationStatus === 'verified').length;
    const lastLiveAt = items
      .filter((s) => s.source === 'live' && s.lastCheckedAt)
      .map((s) => s.lastCheckedAt as string)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return { open, closing, live, verified, total: items.length, lastLiveAt };
  }, [all]);

  function formatRelative(iso: string | undefined) {
    if (!iso) return null;
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.round(hours / 24)} d ago`;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function daysLeft(deadline: string): number | null {
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 ? Math.ceil(diff / 86_400_000) : null;
  }

  return (
    <div className="space-y-6">
      {/* ── Live scholarships band ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-900/20 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 p-6 text-white shadow-md">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`absolute inline-flex h-full w-full rounded-full ${liveState === 'running' ? 'bg-amber-300' : 'bg-green-400'} opacity-75 animate-ping`} />
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${liveState === 'running' ? 'bg-amber-300' : 'bg-green-400'}`} />
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-blue-200">
                {liveState === 'running' ? 'Searching the live web…' : 'Live scholarships'}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold leading-snug sm:text-2xl">
              Discover what is open right now
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-200">
              One tap scans for currently-open schemes from official portals and the web —
              each listing is stored with a source link. Nothing here is invented; entries
              always show where they came from.
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs text-blue-300">
              <Radio className="h-3.5 w-3.5" />
              {stats.lastLiveAt
                ? `Live search last ran ${formatRelative(stats.lastLiveAt)}.`
                : 'The live search has not run yet on this catalogue.'}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              onClick={runLiveSearch}
              disabled={liveState === 'running'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-lg transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {liveState === 'running' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {liveState === 'running' ? 'Searching…' : 'Run live search'}
            </button>
            {liveState === 'idle' && (
              <span className="flex items-center gap-1.5 justify-end text-[11px] text-blue-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Grounded in official sources
              </span>
            )}
          </div>
        </div>

        {liveMessage && (
          <div
            className={`relative mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-xs leading-relaxed ${
              liveState === 'error'
                ? 'border border-red-400/30 bg-red-500/10 text-red-100'
                : 'border border-green-400/30 bg-green-500/10 text-green-100'
            }`}
          >
            {liveState === 'error' ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
            )}
            {liveMessage}
          </div>
        )}

        {(stats.total > 0) && (
          <div className="relative mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white">
              {stats.total} listing{stats.total === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1.5 text-green-100 ring-1 ring-inset ring-green-400/30">
              <span className="h-1.5 w-1.5 rounded-full bg-green-300" /> {stats.open} open
            </span>
            {stats.closing > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-amber-100 ring-1 ring-inset ring-amber-400/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" /> {stats.closing} closing soon
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 px-3 py-1.5 text-purple-100 ring-1 ring-inset ring-purple-400/30">
              <Radio className="h-3 w-3" /> {stats.live} live
            </span>
            {stats.verified > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1.5 text-blue-100 ring-1 ring-inset ring-blue-400/30">
                <CheckCircle2 className="h-3 w-3" /> {stats.verified} admin-verified
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Explore Scholarships</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Search verified listings by state, education level, course, category, income and type.
          </p>
        </div>
        <Link href="/dashboard/eligibility" className="btn-secondary !py-2.5 text-sm">
          <CheckCircle2 className="h-4 w-4" /> Check eligibility
        </Link>
      </div>

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

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {all === null ? (
        <div className="grid gap-4 lg:grid-cols-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="h-5 w-2/3 rounded-lg bg-gray-200" />
                <div className="h-5 w-16 rounded-full bg-gray-100" />
              </div>
              <div className="mt-4 h-9 w-1/3 rounded-xl bg-blue-50" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-4/5 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : all.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center">
          <Radio className={`mx-auto h-10 w-10 text-gray-300 ${liveState === 'running' ? 'text-blue-400' : ''}`} />
          <p className="mt-4 text-sm font-semibold text-gray-700">
            {liveState === 'running' ? 'Scanning official sources for open schemes…' : 'The catalogue is empty — run the live search above'}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-500">
            The live search only lists schemes it can trace to an official page, each stored with its
            source link. Entries are marked <b>Live · verify at source</b> until an administrator confirms them.
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
            const isLive = s.source === 'live';
            return (
              <Link key={s.id} href={`/dashboard/scholarships/${s.id}`} className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-start gap-1.5 text-base font-bold leading-snug text-gray-900 group-hover:text-blue-700">
                      {s.name}
                      {isLive && <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-gray-300" />}
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500"><Building2 className="h-3.5 w-3.5" /> {s.provider}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={`badge ${getStatusColor(s.status)} capitalize`}>{s.status.replace('-', ' ')}</span>
                    {isLive && (
                      <span className="badge items-center gap-1 bg-indigo-50 text-[10px] text-indigo-700">
                        <Radio className="h-2.5 w-2.5" /> Live
                      </span>
                    )}
                  </div>
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
                    {dl !== null && (
                      <span className={`font-semibold ${dl <= 7 ? 'text-red-600' : 'text-gray-600'}`}>
                        ({dl}d left)
                      </span>
                    )}
                  </span>
                  {isLive ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-700" title={`Source: ${s.sourceUrl} · checked ${formatRelative(s.lastCheckedAt)}`}>
                      <ExternalLink className="h-3.5 w-3.5" /> Verify at source
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 font-semibold ${verified ? 'text-green-700' : 'text-amber-700'}`}>
                      {verified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {verified ? 'Verified' : 'Needs verification'}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-gray-100 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <p className="text-[11px] leading-relaxed text-gray-500">
          Live listings are gathered from the web and always link to their official source — open the
          link before applying. Admin-verified listings have been checked manually against the provider.
        </p>
      </div>
    </div>
  );
}
