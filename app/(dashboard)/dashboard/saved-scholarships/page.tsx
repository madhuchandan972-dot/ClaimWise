'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookmarkCheck,
  Loader2,
  AlertTriangle,
  Trash2,
  IndianRupee,
  CalendarDays,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import type { Scholarship } from '@/lib/types';

interface SavedEntry {
  scholarshipId: string;
  savedAt: string;
  scholarship: Scholarship | null;
}

export default function SavedScholarshipsPage() {
  const [entries, setEntries] = useState<SavedEntry[] | null>(null);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/scholarships/saved');
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Could not load saved scholarships.');
        setEntries([]);
        return;
      }
      setEntries(data.saved as SavedEntry[]);
      setError('');
    } catch {
      setError('Network error while loading saved scholarships.');
      setEntries([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    setRemoving(id);
    try {
      const res = await fetch(`/api/scholarships/saved?scholarshipId=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Could not remove the scholarship.');
        return;
      }
      await load();
    } finally {
      setRemoving('');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Saved Scholarships</h1>
        <p className="mt-1 text-sm text-gray-500">Scholarships you bookmarked for later. Saves are tied to your account.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {entries === null ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-700" /></div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <BookmarkCheck className="h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-semibold text-gray-700">No saved scholarships</p>
          <p className="mt-1 text-xs text-gray-500">Open a scholarship and use “Save scholarship” to keep it here.</p>
          <Link href="/dashboard/scholarships" className="btn-secondary mt-4 !py-2 text-xs">Explore scholarships</Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {entries.map((entry) => (
            <article key={entry.scholarshipId} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              {entry.scholarship ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/dashboard/scholarships/${entry.scholarship.id}`} className="text-base font-bold text-gray-900 hover:text-blue-700">
                        {entry.scholarship.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500">{entry.scholarship.provider}</p>
                    </div>
                    <button
                      onClick={() => remove(entry.scholarshipId)}
                      disabled={removing === entry.scholarshipId}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${entry.scholarship.name}`}
                    >
                      {removing === entry.scholarshipId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1 font-semibold"><IndianRupee className="h-3.5 w-3.5" /> {entry.scholarship.amount}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {new Date(entry.scholarship.deadline).toLocaleDateString('en-IN')}</span>
                    <span className={`flex items-center gap-1 font-semibold ${entry.scholarship.verificationStatus === 'verified' ? 'text-green-700' : 'text-amber-700'}`}>
                      {entry.scholarship.verificationStatus === 'verified' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                      {entry.scholarship.verificationStatus === 'verified' ? 'Verified' : 'Needs verification'}
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-gray-700">This scholarship is no longer in the catalogue</p>
                  <button onClick={() => remove(entry.scholarshipId)} className="mt-2 text-xs font-semibold text-red-600 hover:underline">Remove</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
