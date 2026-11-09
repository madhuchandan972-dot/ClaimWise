'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2, AlertCircle, UserRound } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import SecurityPanel from '@/components/dashboard/SecurityPanel';
import type { User } from '@/lib/types';

interface ProfileResponse {
  success: boolean;
  profile: User;
  profileCompletion: number;
  missingFields?: string[];
}

const STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other'];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];

export default function ProfilePage() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState<Partial<User>>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/profile');
    const d = (await r.json()) as ProfileResponse & { error?: string };
    if (d.success) {
      setData(d);
      setForm({
        name: d.profile.name,
        phone: d.profile.phone,
        dob: d.profile.dob,
        gender: d.profile.gender,
        state: d.profile.state,
        district: d.profile.district,
        religion: d.profile.religion,
        category: d.profile.category,
        disability: d.profile.disability,
        familyIncome: d.profile.familyIncome,
        college: d.profile.college,
        course: d.profile.course,
        educationLevel: d.profile.educationLevel ?? '',
        year: d.profile.year,
        marksPercentage: d.profile.marksPercentage,
        marksExam: d.profile.marksExam,
      });
    } else {
      setError(d.error ?? 'Could not load your profile.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function field(k: keyof User, value: string | number | boolean) {
    setForm((p) => ({ ...p, [k]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        ...form,
        familyIncome: Number(form.familyIncome ?? 0),
        marksPercentage: form.marksPercentage ? Number(form.marksPercentage) : undefined,
      };
      const r = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!d.success) {
        setError(d.error ?? 'Could not save your profile.');
        return;
      }
      setEditing(false);
      setSaved(true);
      await load();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (data === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <Loader2 className="h-8 w-8 animate-spin text-blue-600" />}
      </div>
    );
  }

  const p = data.profile;
  const incomeDisplay = p.familyIncome ? p.familyIncome.toLocaleString('en-IN') : '—';

  const rows: [string, string, keyof Partial<User>][] = [
    ['Email', p.email, 'email'],
    ['Phone', p.phone || '—', 'phone'],
    ['Date of birth', p.dob || '—', 'dob'],
    ['Gender', p.gender, 'gender'],
    ['Home state', p.state, 'state'],
    ['District', p.district, 'district'],
    ['Religion', p.religion || '—', 'religion'],
    ['Category', p.category, 'category'],
    ['Disability', p.disability ? 'Yes' : 'No / not stated', 'disability'],
    ['Family income (annual)', `₹${incomeDisplay}`, 'familyIncome'],
    ['College', p.college, 'college'],
    ['Education level', p.educationLevel || '—', 'educationLevel'],
    ['Course', p.course, 'course'],
    ['Year of study', p.year, 'year'],
    ['Marks %', p.marksPercentage ? `${p.marksPercentage}%` : '—', 'marksPercentage'],
    ['Marks exam', p.marksExam || '—', 'marksExam'],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Student Profile</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            This is the approved data your applications and eligibility checks use. Edit anything
            that looks inaccurate — matching updates immediately.
          </p>
        </div>
        {!editing && (
          <button onClick={() => { setEditing(true); setSaved(false); }} className="btn-primary !py-2.5 text-sm">
            Edit profile
          </button>
        )}
      </div>

      {/* Completion */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <UserRound className="h-4 w-4 text-blue-600" /> Profile completion
          </p>
          <span className="text-sm font-bold text-blue-700">{data.profileCompletion}%</span>
        </div>
        <ProgressBar value={data.profileCompletion} />
        {data.missingFields && data.missingFields.length > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            Still missing: {data.missingFields.join(', ')}. AI extraction from documents can fill several of these —
            <Link href="/dashboard/documents/intelligence" className="ml-1 font-semibold text-blue-600 hover:underline">run document intelligence</Link>.
          </p>
        )}
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <p className="text-xs text-green-700">Profile saved. Eligibility matching will use this data from now on.</p>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Read view */}
      {!editing && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <dl className="divide-y divide-gray-50">
            {rows.map(([label, value, key]) => (
              <div key={key} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className="text-right text-sm font-semibold text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-name" className="label">Full name</label>
              <input id="pf-name" value={String(form.name ?? '')} onChange={(e) => field('name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="pf-phone" className="label">Phone</label>
              <input id="pf-phone" inputMode="numeric" value={String(form.phone ?? '')} onChange={(e) => field('phone', e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="pf-dob" className="label">Date of birth</label>
              <input id="pf-dob" type="date" value={String(form.dob ?? '').slice(0, 10)} onChange={(e) => field('dob', e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="pf-gender" className="label">Gender</label>
              <select id="pf-gender" value={String(form.gender ?? '')} onChange={(e) => field('gender', e.target.value)} className="input-field">
                <option value="">Select…</option>
                <option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option>
              </select>
            </div>
            <div>
              <label htmlFor="pf-state" className="label">Home state</label>
              <select id="pf-state" value={String(form.state ?? '')} onChange={(e) => field('state', e.target.value)} className="input-field">
                <option value="">Select…</option>
                {STATES.map((s) => (<option key={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="pf-district" className="label">District</label>
              <input id="pf-district" value={String(form.district ?? '')} onChange={(e) => field('district', e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="pf-religion" className="label">Religion</label>
              <input id="pf-religion" value={String(form.religion ?? '')} onChange={(e) => field('religion', e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="pf-category" className="label">Category</label>
              <select id="pf-category" value={String(form.category ?? '')} onChange={(e) => field('category', e.target.value)} className="input-field">
                <option value="">Select…</option>
                {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="pf-income" className="label">Annual family income (₹)</label>
              <input id="pf-income" inputMode="numeric" value={String(form.familyIncome ?? '')} onChange={(e) => field('familyIncome', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} className="input-field" />
            </div>
            <div>
              <label htmlFor="pf-marks" className="label">Last exam marks (%; 0–100)</label>
              <input id="pf-marks" inputMode="decimal" value={String(form.marksPercentage ?? '')} onChange={(e) => setForm((p) => ({ ...p, marksPercentage: Number(e.target.value) || undefined }))} className="input-field" />
            </div>
            <div>
              <label htmlFor="pf-marksexam" className="label">Which exam?</label>
              <input id="pf-marksexam" value={String(form.marksExam ?? '')} onChange={(e) => field('marksExam', e.target.value)} placeholder="e.g. 12th (PUC)" className="input-field" />
            </div>
            <div>
              <label htmlFor="pf-college" className="label">College</label>
              <input id="pf-college" value={String(form.college ?? '')} onChange={(e) => field('college', e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="pf-edulevel" className="label">Education level</label>
              <select id="pf-edulevel" value={String(form.educationLevel ?? '')} onChange={(e) => field('educationLevel', e.target.value)} className="input-field">
                <option value="">Select…</option>
                {['10th', '12th', 'Diploma', 'Undergraduate', 'Postgraduate', 'PhD'].map((l) => (<option key={l}>{l}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="pf-course" className="label">Course</label>
              <input id="pf-course" value={String(form.course ?? '')} onChange={(e) => field('course', e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="pf-year" className="label">Year of study</label>
              <select id="pf-year" value={String(form.year ?? '')} onChange={(e) => field('year', e.target.value)} className="input-field">
                <option value="">Select…</option>
                {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'].map((y) => (<option key={y}>{y}</option>))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => { setEditing(false); setError(''); }} className="btn-secondary flex-1" disabled={saving}>Cancel</button>
            <button onClick={save} className="btn-primary flex-1" disabled={saving}>
              {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : 'Save changes'}
            </button>
          </div>
          <p className="mt-3 text-[11px] text-gray-400">
            Your email address is managed by Supabase Auth and cannot be changed here. Only fields
            relevant to scholarship eligibility are collected.
          </p>
        </div>
      )}

      {/* Data note */}
      <div className="rounded-xl bg-gray-100 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-gray-500">
          <b>How this data is used:</b> these fields power the rule-based scholarship eligibility
          engine. They are stored in your Supabase profile and protected by Row Level Security.
          Nothing is pre-filled and nothing is shared with another account.
        </p>
      </div>

      {/* Security — authenticator lock (TOTP) */}
      <div className="pt-2">
        <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Security</h2>
        <SecurityPanel />
      </div>
    </div>
  );
}
