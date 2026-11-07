'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  LogIn,
  ShieldAlert,
  Loader2,
  CircleCheckBig,
  ExternalLink,
} from 'lucide-react';

interface MockPayload {
  scholarship: string;
  scholarshipId: string;
  fields: { portalField: string; source: string; value: string; approved: boolean }[];
}

function MockPortalInner() {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<MockPayload | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [step, setStep] = useState<'login' | 'form' | 'declaration' | 'done'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const appId = searchParams.get('app') ?? '';

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cw_mock_portal');
      if (!raw) {
        setError('No prepared application found. Start from the Application Assistant.');
        return;
      }
      setPayload(JSON.parse(raw) as MockPayload);
    } catch {
      setError('Could not read the prepared application data.');
    }
  }, []);

  async function confirmSubmitted() {
    if (!payload) return;
    setSubmitting(true);
    setError('');
    try {
      // 1. Record the application as submitted (explicit student confirmation)
      const r = await fetch(`/api/applications/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarshipId: payload.scholarshipId }),
      });
      const created = await r.json();
      if (!created.success) {
        setError(created.error ?? 'Could not record the application.');
        return;
      }
      const patch = await fetch(`/api/applications/${created.application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'submitted',
          confirmSubmitted: true,
          notes: 'Submitted by student through the mock portal demonstration.',
          nextAction: 'Track for verification updates.',
        }),
      });
      const patched = await patch.json();
      if (!patched.success) {
        setError(patched.error ?? 'Could not update the application status.');
        return;
      }
      setStep('done');
    } catch {
      setError('Network error while recording the application.');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <CircleCheckBig className="h-7 w-7 text-green-600" />
        </span>
        <h1 className="text-xl font-bold text-gray-900">Application confirmed as submitted</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Because <b>you</b> clicked confirm, ClaimWise has recorded “{payload?.scholarship}” as
          submitted. That is the only way an application can reach the Submitted state — there is no
          automatic submission anywhere in the product.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard/applications" className="btn-primary">View it in the Tracker</Link>
          <Link href="/dashboard/assistant" className="btn-secondary">Assistant</Link>
        </div>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm text-amber-700">{error}</p>
        <Link href="/dashboard/assistant" className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline">
          ← Back to the Assistant
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/dashboard/assistant" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Leave the portal
      </Link>

      {/* Mock disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs leading-relaxed text-amber-700">
          <b>This portal is a mock.</b> It exists to demonstrate what a ClaimWise-assisted
          application looks like on a scholarship website. No real portal is connected, no real
          data is transmitted. Live integrations will only ever be built for supported portals
          where automation respects their terms of use.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Portal header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-slate-900 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-xs font-black text-white">NSP</span>
            <div>
              <p className="text-sm font-bold text-white">National Scholarship Portal</p>
              <p className="text-[10px] text-slate-400">Demonstration replica — not the real portal</p>
            </div>
          </div>
          {signedIn && (
            <button onClick={() => { setSignedIn(false); setStep('login'); }} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800">
              Sign out
            </button>
          )}
        </div>

        {/* Step: login */}
        {step === 'login' && (
          <div className="p-6">
            <h2 className="text-base font-bold text-gray-900">Student login</h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              In a real integration, this login is always yours to perform. ClaimWise never stores
              or fills portal passwords, and verification steps (OTP, CAPTCHA) are always handled
              by the student. Test it here with the demo credentials.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (captchaInput.trim().toUpperCase() !== captcha.toUpperCase()) {
                  setError('CAPTCHA does not match. Try again.');
                  return;
                }
                setError('');
                setSignedIn(true);
                setStep('form');
              }}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <div>
                <label htmlFor="mp-user" className="label">Portal ID</label>
                <input id="mp-user" defaultValue="DEMO-STUDENT-01" className="input-field" />
              </div>
              <div>
                <label htmlFor="mp-pass" className="label">Password</label>
                <input id="mp-pass" type="password" defaultValue="demo-password" className="input-field" />
              </div>
              <div>
                <label htmlFor="mp-captcha" className="label">CAPTCHA: type <span className="font-mono font-bold text-gray-800 select-none">{captcha || '——'}</span></label>
                <input id="mp-captcha" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} placeholder="Enter the characters" className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setCaptcha(Math.random().toString(36).slice(2, 6).toUpperCase())}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  ↻ Generate CAPTCHA first
                </button>
              </div>
              {error && <p className="text-xs text-red-600 sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary !py-2.5 text-xs">
                  <LogIn className="h-3.5 w-3.5" /> Sign in to portal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step: review prefilled form */}
        {step === 'form' && payload && (
          <div className="p-6">
            <h2 className="text-base font-bold text-gray-900">Application form · {payload.scholarship}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-green-700">
              <CircleCheckBig className="h-3.5 w-3.5" /> {payload.fields.length} fields pre-filled by ClaimWise from your approved profile data — please verify each one.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
              {payload.fields.map((f, i) => (
                <div key={f.portalField} className={`flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-center ${i % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                  <span className="w-56 shrink-0 text-xs font-medium text-gray-600">{f.portalField}</span>
                  <span className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800">{f.value}</span>
                  <span className="text-[10px] text-gray-400">{f.source}</span>
                </div>
              ))}
            </div>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => setStep('declaration')} className="btn-primary !py-2.5 text-xs">
                Reviewed — I confirm these values are correct
              </button>
            </div>
          </div>
        )}

        {/* Step: declaration + submit confirmation */}
        {step === 'declaration' && payload && (
          <div className="p-6">
            <h2 className="text-base font-bold text-gray-900">Final declaration</h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              The real portal shows a declaration that you must accept personally. ClaimWise does
              not accept declarations for you.
            </p>
            <label className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <input type="checkbox" id="declaration" className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-xs leading-relaxed text-gray-700">
                I confirm the information above is accurate, and I understand this demonstration
                does not contact any real scholarship portal.
              </span>
            </label>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => setStep('form')} className="btn-secondary !py-2.5 text-xs">Back to fields</button>
              <button
                onClick={(e) => {
                  const box = (e.currentTarget.parentElement?.parentElement?.querySelector('#declaration') as HTMLInputElement | null);
                  if (!box?.checked) {
                    setError('Please accept the declaration first — it is always the student\'s confirmation.');
                    return;
                  }
                  setError('');
                  confirmSubmitted();
                }}
                disabled={submitting}
                className="btn-primary !py-2.5 text-xs"
              >
                {submitting ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording…</>) : (<><ExternalLink className="h-3.5 w-3.5" /> Submit application myself & confirm</>)}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-gray-400">
        Mock portal · application reference <span className="font-mono">{appId ? `CW-${appId.toUpperCase()}` : '—'} — nothing leaves your browser session</span>
      </p>
    </div>
  );
}

export default function MockPortalPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <MockPortalInner />
    </Suspense>
  );
}
