'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  LogOut,
  UserRound,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [changing, setChanging] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (!data.success) {
        setProfileError(data.error ?? 'Could not load your account.');
        return;
      }
      setProfile(data.profile as User);
      setName((data.profile as User).name ?? '');
      setPhone((data.profile as User).phone ?? '');
    } catch {
      setProfileError('Network error while loading your account.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) { setProfileError('Enter your name.'); return; }
    setSavingProfile(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: phone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setProfileError(data.error ?? 'Could not save your account.');
        return;
      }
      setProfileSaved(true);
      await load();
    } catch {
      setProfileError('Network error. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);
    if (password.length < 8) { setPasswordError('Use at least 8 characters.'); return; }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordError('Use at least one letter and one number.');
      return;
    }
    if (password !== confirm) { setPasswordError('Passwords do not match.'); return; }

    setChanging(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPasswordError(error.message);
        return;
      }
      setPassword('');
      setConfirm('');
      setPasswordSaved(true);
    } catch {
      setPasswordError('Could not update the password. Please try again.');
    } finally {
      setChanging(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (!profile && !profileError) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account, password and security.</p>
      </div>

      {profileError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{profileError}</p>
        </div>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <UserRound className="h-4 w-4 text-blue-700" /> Account details
        </h2>
        <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="accountName" className="label">Full name</label>
            <input id="accountName" value={name} onChange={(e) => { setName(e.target.value); setProfileSaved(false); }} maxLength={120} className="input-field" />
          </div>
          <div>
            <label htmlFor="accountPhone" className="label">Phone <span className="font-normal text-gray-400">(optional)</span></label>
            <input id="accountPhone" value={phone} onChange={(e) => { setPhone(e.target.value); setProfileSaved(false); }} maxLength={10} inputMode="numeric" className="input-field" placeholder="10-digit number" />
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-500">
              Email: <span className="font-semibold text-gray-800">{profile?.email}</span> — managed by
              Supabase Auth and shown read-only here.
            </p>
          </div>
          {profileSaved && (
            <p className="flex items-center gap-2 text-xs text-green-700 sm:col-span-2"><CheckCircle2 className="h-3.5 w-3.5" /> Account details saved.</p>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={savingProfile} className="btn-primary !py-2.5 text-sm">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save account details
            </button>
          </div>
        </form>
        <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
          Scholarship matching uses the student details on your{' '}
          <Link href="/dashboard/profile" className="font-semibold text-blue-700 hover:underline">
            scholarship profile
          </Link>
          .
        </p>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <KeyRound className="h-4 w-4 text-blue-700" /> Change password
        </h2>
        <form onSubmit={changePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="newPassword" className="label">New password</label>
            <input id="newPassword" type="password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordSaved(false); }} className="input-field" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="label">Confirm new password</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setPasswordSaved(false); }} className="input-field" />
          </div>
          {passwordError && <p className="text-xs text-red-600 sm:col-span-2">{passwordError}</p>}
          {passwordSaved && <p className="flex items-center gap-2 text-xs text-green-700 sm:col-span-2"><CheckCircle2 className="h-3.5 w-3.5" /> Password updated by Supabase Auth.</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={changing} className="btn-secondary !py-2.5 text-sm">
              {changing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Update password
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <ShieldCheck className="h-4 w-4 text-blue-700" /> Security
        </h2>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-gray-600">
          <li>• Sessions are stored in secure HttpOnly cookies by Supabase Auth — never in localStorage.</li>
          <li>• Every API route verifies the session server-side before reading or writing data.</li>
          <li>• Documents live in a private Supabase Storage bucket; there are no public file URLs.</li>
          <li>• Row Level Security scopes every vault table to the authenticated account.</li>
        </ul>
        <button onClick={logout} disabled={loggingOut} className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
          {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Sign out securely
        </button>
      </section>
    </div>
  );
}
