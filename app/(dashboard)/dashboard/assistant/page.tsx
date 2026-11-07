'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wand2,
  Search,
  ArrowRight,
  CircleCheckBig,
  ClipboardList,
  Info,
  Loader2,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { Scholarship, Application, EligibilityResult } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';
import AssistantChat from '@/components/dashboard/AssistantChat';

export default function AssistantIndexPage() {
  const [scholarships, setScholarships] = useState<Scholarship[] | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityResult[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/scholarships').then((r) => r.json()),
      fetch('/api/applications').then((r) => r.json()),
      fetch('/api/eligibility').then((r) => r.json()),
    ])
      .then(([sch, apps, elig]) => {
        if (sch.success) setScholarships(sch.scholarships as Scholarship[]);
        if (apps.success) setApplications(apps.applications as Application[]);
        if (elig.success) setEligibility(elig.results as EligibilityResult[]);
      })
      .catch(() => setScholarships([]));
  }, []);

  const eligibleMap = new Map(eligibility.map((e) => [e.scholarshipId, e]));
  const appMap = new Map(applications.map((a) => [a.scholarshipId, a]));

  const sorted = (scholarships ?? [])
    .filter((s) => s.status !== 'closed')
    .sort((a, b) => {
      const ea = eligibleMap.get(a.id);
      const eb = eligibleMap.get(b.id);
      const rank = (x?: EligibilityResult) => (x?.status === 'eligible' ? 0 : x?.status === 'possibly-eligible' ? 1 : 2);
      return rank(ea) - rank(eb);
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Application Assistant</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Pick a scholarship — the assistant checks your eligibility, verifies your documents,
          prepares application fields from your approved profile, and guides you through the
          submission steps on a demonstration portal.
        </p>
      </div>

      {applications.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
            <ClipboardList className="h-4 w-4 text-blue-600" /> Your sessions in progress
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {applications.slice(0, 4).map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/assistant/${a.scholarshipId}`}
                className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 transition-all hover:border-blue-200 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{a.scholarshipName}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{a.nextAction}</p>
                </div>
                <span className={`badge shrink-0 ${getStatusColor(a.status)} capitalize`}>
                  {a.status.replace(/-/g, ' ')}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <p className="text-[11px] leading-relaxed text-blue-700">
          <b>How the assistant works:</b> ClaimWise prepares and reviews — <b>you</b> submit.
          Logins, one-time passwords, CAPTCHAs and the final submission always happen with you in
          control. Applications are only marked &quot;Submitted&quot; after you explicitly confirm it.
        </p>
      </div>

      {scholarships === null ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((s) => {
            const e = eligibleMap.get(s.id);
            const app = appMap.get(s.id);
            const canStart = s.status === 'open' || s.status === 'closing-soon';
            return (
              <article key={s.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold leading-snug text-gray-900">{s.name}</h3>
                  {e && (
                    <Badge variant={e.status === 'eligible' ? 'success' : e.status === 'possibly-eligible' ? 'warning' : 'error'}>
                      {e.status === 'eligible' ? 'Eligible' : e.status === 'possibly-eligible' ? 'Possible' : 'Not eligible'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500">{s.provider}</p>
                <p className="mt-2 text-xs font-bold text-blue-800">{s.amount}</p>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400">
                  {app ? (
                    <>Existing session · status <span className={`badge ${getStatusColor(app.status)} !text-[10px]`}>{app.status.replace(/-/g, ' ')}</span></>
                  ) : (
                    <>{e?.requiredDocuments.length ?? 0} required documents</>
                  )}
                </div>

                <div className="mt-4 flex gap-2 border-t border-gray-50 pt-3">
                  <Link
                    href={`/dashboard/scholarships/${s.id}`}
                    className="flex-1 rounded-xl border border-gray-200 py-2 text-center text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-700"
                  >
                    Details
                  </Link>
                  {app ? (
                    <Link
                      href={`/dashboard/assistant/${s.id}`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Resume <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <button
                      onClick={async (ev) => {
                        ev.preventDefault();
                        const btn = ev.currentTarget;
                        btn.innerHTML = '<span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>';
                        const r = await fetch('/api/applications', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ scholarshipId: s.id }),
                        });
                        const d = await r.json();
                        if (d.success) location.href = `/dashboard/assistant/${s.id}`;
                        else { btn.textContent = 'Error — retry'; }
                      }}
                      disabled={!canStart}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                      title={canStart ? 'Start an application assistance session' : `Applications are ${s.status.replace('-', ' ')}`}
                    >
                      <Wand2 className="h-3 w-3" /> {canStart ? 'Start' : s.status}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <AssistantChat />
    </div>
  );
}
