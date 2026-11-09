'use client';

// ============================================================
// ClaimWise — SecurityPanel
//
// The Profile page's "Security" card: enroll or remove an
// authenticator app (RFC 6238 TOTP) for the sensitive-action
// lock. Two-step, honest enrollment:
//   1. "Set up" shows a QR (() + the raw seed for manual entry)
//   2. Typing the app's current 6-digit code confirms it
// Turning it off is one deliberate click — the session holder is
// the authenticated owner.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, X } from 'lucide-react';

type Phase =
  | { kind: 'loading' }
  | { kind: 'idle'; enrolled: boolean }
  | { kind: 'enrolling'; qr: string; uri: string; secret: string }
  | { kind: 'error'; message: string };

export default function SecurityPanel() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [enabledNote, setEnabledNote] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/security/totp');
      const data = await r.json();
      if (!r.ok || !data.success) {
        setPhase({ kind: 'error', message: data.error ?? 'Could not load security status.' });
        return;
      }
      setPhase({ kind: 'idle', enrolled: data.enrolled === true });
    } catch {
      setPhase({ kind: 'error', message: 'Network error while checking security status.' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startSetup() {
    setBusy(true);
    setEnabledNote('');
    try {
      const r = await fetch('/api/security/totp/setup', { method: 'POST' });
      const data = await r.json();
      if (!r.ok || !data.success) {
        setPhase({ kind: 'error', message: data.error ?? 'Could not start the setup.' });
        return;
      }
      setCode('');
      setVerifyError('');
      setPhase({ kind: 'enrolling', qr: data.qrDataUrl, uri: data.uri, secret: data.secret });
    } catch {
      setPhase({ kind: 'error', message: 'Network error during setup.' });
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode() {
    setBusy(true);
    setVerifyError('');
    try {
      const r = await fetch('/api/security/totp/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) {
        setVerifyError(data.error ?? 'Verification failed.');
        return;
      }
      setPhase({ kind: 'idle', enrolled: true });
      setEnabledNote('Authenticator app is now protecting this vault. Next time you open a document you can verify with it instead of SMS.');
    } catch {
      setVerifyError('Network error while confirming.');
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const r = await fetch('/api/security/totp', { method: 'DELETE' });
      const data = await r.json();
      if (!r.ok || !data.success) {
        setPhase({ kind: 'error', message: data.error ?? 'Could not turn off the authenticator.' });
        return;
      }
      setPhase({ kind: 'idle', enrolled: false });
      setEnabledNote('');
    } catch {
      setPhase({ kind: 'error', message: 'Network error while turning off.' });
    } finally {
      setBusy(false);
    }
  }

  if (phase.kind === 'loading') {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Checking security status…</p>
        </div>
      </div>
    );
  }

  if (phase.kind === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">{phase.message}</p>
      </div>
    );
  }

  if (phase.kind === 'enrolling') {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900">1. Add ClaimWise to your authenticator app</h3>
        <p className="mt-1 text-xs text-gray-500">
          Open Google Authenticator / Authy / Microsoft Authenticator → “+” → Scan QR code.
        </p>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={phase.qr} alt="Authenticator QR code" className="h-[220px] w-[220px] rounded-xl border border-gray-100" />
          <div className="w-full min-w-0 sm:w-auto sm:flex-1">
            <p className="text-xs font-semibold text-gray-700">Can&apos;t scan? Type this key instead:</p>
            <code className="mt-1 block w-full break-all rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-700">{phase.secret}</code>
          </div>
        </div>

        <h3 className="mt-6 text-sm font-bold text-gray-900">2. Enter the current 6-digit code</h3>
        <div className="mt-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            maxLength={6}
            aria-label="Authenticator code"
            className="input-field text-center text-lg tracking-[0.4em]"
          />
          <button onClick={confirmCode} disabled={busy || code.length !== 6} className="btn-primary shrink-0 px-5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
          </button>
          <button
            onClick={() => setPhase({ kind: 'idle', enrolled: false })}
            disabled={busy}
            className="btn-secondary shrink-0 px-3"
            aria-label="Cancel setup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {verifyError && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{verifyError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <KeyRound className="h-5 w-5 text-blue-700" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Authenticator lock</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
              {phase.enrolled
                ? 'Your authenticator app can verify sensitive actions (opening documents) — no SMS needed.'
                : 'Protect opening your documents with a code from your phone’s authenticator app. Free, offline, no gateway needed.'}
            </p>
          </div>
        </div>
        {phase.enrolled && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Active
          </span>
        )}
      </div>

      {enabledNote && (
        <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">{enabledNote}</p>
      )}

      <button
        onClick={phase.enrolled ? turnOff : startSetup}
        disabled={busy}
        className={phase.enrolled ? 'btn-secondary mt-4' : 'btn-primary mt-4'}
      >
        {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : phase.enrolled ? 'Turn off authenticator' : 'Set up authenticator app'}
      </button>
    </div>
  );
}
