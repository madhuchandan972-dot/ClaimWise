'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  ChevronDown,
  CheckCircle2,
  CircleDot,
  Circle,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { Application, ApplicationStatus } from '@/lib/types';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  'not-started': 'Not Started',
  preparing: 'Preparing',
  'awaiting-review': 'Awaiting Student Review',
  'ready-to-submit': 'Ready to Submit',
  submitted: 'Submitted',
  'under-verification': 'Under Verification',
  approved: 'Approved',
  rejected: 'Rejected',
  'more-info-required': 'More Information Required',
};

/** Statuses that mean the submission (or its outcome) is already recorded. */
const POST_SUBMISSION: ApplicationStatus[] = [
  'submitted',
  'under-verification',
  'approved',
  'rejected',
  'more-info-required',
];

/**
 * Status buttons shown per application. Pre-submission applications get
 * preparation-stage options; submitted applications get portal-tracking
 * options (the student explicitly clicks them, which is recorded as
 * their confirmation for that transition).
 */
function statusOptionsFor(app: Application): ApplicationStatus[] {
  const pool = POST_SUBMISSION.includes(app.status) && app.status !== 'more-info-required'
    ? ['under-verification', 'approved', 'rejected', 'more-info-required'] as ApplicationStatus[]
    : ['preparing', 'awaiting-review', 'ready-to-submit'] as ApplicationStatus[];
  return pool.filter((s) => s !== app.status).slice(0, 3);
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState<Application | null>(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/applications');
    const d = await r.json();
    if (d.success) setApps(d.applications as Application[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(app: Application, status: ApplicationStatus, extra?: { confirmSubmitted?: boolean; notes?: string; nextAction?: string }) {
    setBusy(app.id);
    setError('');
    try {
      const r = await fetch(`/api/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extra }),
      });
      const d = await r.json();
      if (!d.success) {
        setError(d.error ?? 'Could not update the application.');
        return;
      }
      setOpen(app.id);
      await load();
      setConfirmSubmit(null);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function removeApp(app: Application) {
    setBusy(app.id);
    try {
      const r = await fetch(`/api/applications/${app.id}`, { method: 'DELETE' });
      const d = await r.json();
      if (!d.success) {
        setError(d.error ?? 'Could not delete.');
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Application Tracker</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Every scholarship application you&apos;re working on, with the full history of where it
          stands and what comes next.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {apps === null ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : apps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-semibold text-gray-700">No applications yet</p>
          <p className="mt-1 text-xs text-gray-500">Start one from the Application Assistant.</p>
          <Link href="/dashboard/assistant" className="btn-primary mt-5 !py-2.5 text-xs">
            Open the Assistant <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const isOpen = open === app.id;
            const isTerminal = ['approved', 'rejected'].includes(app.status);
            return (
              <article key={app.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <button
                  onClick={() => setOpen(isOpen ? null : app.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-gray-900">{app.scholarshipName}</h2>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{app.nextAction}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge variant={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'error' : app.status === 'submitted' || app.status === 'under-verification' ? 'info' : 'warning'}>
                      {STATUS_LABELS[app.status]}
                    </Badge>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-5">
                    {/* Metadata grid */}
                    <div className="grid gap-3 text-xs sm:grid-cols-4">
                      <div><p className="text-gray-400">Application ID</p><p className="mt-0.5 font-mono font-semibold text-gray-700">{app.id}</p></div>
                      <div><p className="text-gray-400">Applied on</p><p className="mt-0.5 font-semibold text-gray-700">{app.appliedDate ? new Date(app.appliedDate).toLocaleDateString('en-IN') : '—'}</p></div>
                      <div><p className="text-gray-400">Docs attached</p><p className="mt-0.5 font-semibold text-gray-700">{app.documents.length}</p></div>
                      <div><p className="text-gray-400">Notes</p><p className="mt-0.5 text-gray-700">{app.notes || '—'}</p></div>
                    </div>

                    {/* Timeline */}
                    <h3 className="mb-3 mt-5 text-xs font-bold text-gray-700">Application history</h3>
                    <ol className="relative ml-1.5 space-y-4 border-l border-gray-200 pl-5">
                      {app.timeline.map((t, i) => (
                        <li key={i} className="relative">
                          <span className="absolute -left-[1.62rem] flex h-4 w-4 items-center justify-center">
                            {t.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : t.status === 'current' ? (
                              <CircleDot className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-300" />
                            )}
                          </span>
                          <p className={`text-xs font-semibold ${t.status === 'pending' ? 'text-gray-400' : 'text-gray-800'}`}>{t.action}</p>
                          <p className="mt-0.5 text-[10px] text-gray-400">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </li>
                      ))}
                    </ol>

                    {/* Actions */}
                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => { setOpen(app.id); setConfirmSubmit(app); }}
                        disabled={busy === app.id || isTerminal}
                        className="btn-primary !px-3 !py-2 text-xs"
                        title="Record that you submitted it on the official portal"
                      >
                        Confirm submission
                      </button>
                      {statusOptionsFor(app).map((s) => (
                        <button
                          key={s}
                          onClick={() => changeStatus(app, s, POST_SUBMISSION.includes(s) ? { confirmSubmitted: true } : undefined)}
                          disabled={busy === app.id || app.status === 'submitted'}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:opacity-40"
                        >
                          Mark “{STATUS_LABELS[s]}”
                        </button>
                      ))}
                      <button
                        onClick={() => removeApp(app)}
                        disabled={busy === app.id}
                        className="ml-auto flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-400 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Confirm submission modal */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-base font-bold text-gray-900">Confirm submission</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Did <b>you</b> submit the application for <b>{confirmSubmit.scholarshipName}</b> on the
              official portal? ClaimWise records &quot;Submitted&quot; only on your explicit
              confirmation — it never submits for you.
            </p>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmSubmit(null)} className="btn-secondary flex-1" disabled={busy === confirmSubmit.id}>
                Not yet
              </button>
              <button
                onClick={() => changeStatus(confirmSubmit, 'submitted', {
                  confirmSubmitted: true,
                  notes: confirmSubmit.notes || 'Confirmed submitted by student.',
                  nextAction: 'Wait for the portal to verify. ClaimWise will surface email confirmations once Gmail integration is active.',
                })}
                disabled={busy === confirmSubmit.id}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {busy === confirmSubmit.id ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Yes, I submitted it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
