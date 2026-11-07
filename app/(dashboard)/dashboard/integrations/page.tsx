'use client';

import { useEffect, useState } from 'react';
import {
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
  BrainCircuit,
} from 'lucide-react';

interface AiStatus {
  documentIntelligence: boolean;
  assistantChat: boolean;
}

export default function IntegrationsPage() {
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [gmailStatus, setGmailStatus] = useState<'ready' | 'not-configured' | null>(null);

  useEffect(() => {
    // Lightweight probe the server exposes AI availability through —
    // the analyze endpoint reports it per call; a dedicated endpoint
    // keeps this page clean without leaking keys.
    fetch('/api/integrations/status')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setAi(d.ai);
          setGmailStatus(d.gmail === 'ready' ? 'ready' : 'not-configured');
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Integrations</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Optional capabilities that activate once their credentials are configured — AI services
          run on the server only, and email access always uses scoped OAuth, never passwords.
        </p>
      </div>

      {/* ── Gmail ── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50">
              <Mail className="h-6 w-6 text-red-500" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Gmail connection</h2>
                <span className={`badge ${gmailStatus === 'ready' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {gmailStatus === 'ready' ? 'OAuth credentials present — flow pending' : 'Future-ready · not configured'}
                </span>
              </div>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
                Will read scholarship confirmation emails, application reference numbers, interview
                calls and missing-document requests, then surface them on your dashboard. Setup
                requires <b>Google OAuth credentials</b> with the minimum scopes
                (<code className="rounded bg-gray-100 px-1">gmail.readonly</code>) — and we never
                request or store your Gmail password.
              </p>
            </div>
          </div>
          <button
            disabled
            title="Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (see README)"
            className="btn-secondary shrink-0 cursor-not-allowed opacity-60"
          >
            <Lock className="h-4 w-4" /> Connect (unavailable)
          </button>
        </div>
        <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-[11px] leading-relaxed text-gray-500">
            <b>What you&apos;ll be asked to approve:</b> read-only access to Gmail for your account,
            used only to detect application-confirmation and portal emails. This interface is the
            placeholder — no Gmail data is accessed in the current build.
          </p>
        </div>
      </section>

      {/* ── AI ── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <BrainCircuit className="h-6 w-6 text-indigo-600" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">AI capabilities (Google Gemini)</h2>
            <p className="mt-1 text-xs text-gray-500">
              Server-side only. The key is set through the environment variable
              <code className="mx-1 rounded bg-gray-100 px-1">GOOGLE_GEMINI_API_KEY</code> and is
              never exposed to the browser.
            </p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Document Intelligence</p>
                  <p className="text-[11px] text-gray-400">Real AI text extraction from uploaded documents</p>
                </div>
                {ai === null ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                ) : ai.documentIntelligence ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600"><CheckCircle2 className="h-4 w-4" /> Active</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600"><XCircle className="h-4 w-4" /> Demo mode</span>
                )}
              </li>
              <li className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Scholarship Assistant chat</p>
                  <p className="text-[11px] text-gray-400">Live conversational help during applications</p>
                </div>
                {ai === null ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                ) : ai.assistantChat ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600"><CheckCircle2 className="h-4 w-4" /> Active</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600"><XCircle className="h-4 w-4" /> Demo mode</span>
                )}
              </li>
            </ul>
            {ai && !ai.documentIntelligence && (
              <p className="mt-3 text-[11px] leading-relaxed text-amber-600">
                In demo mode, document analysis returns clearly-labelled simulated values so you can
                explore the workflow. Add the API key in <code className="rounded bg-gray-100 px-1">.env.local</code> to
                enable real analysis (README, §AI Setup).
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Browser automation note */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">Portal automation — principles</h2>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-gray-600">
          <li>· Autofill assistance only for portals where their terms permit it.</li>
          <li>· Never bypass CAPTCHA, one-time passwords, access controls or anti-bot systems.</li>
          <li>· Logins and final submissions are always performed personally by the student.</li>
          <li>· Application status is recorded only after the student confirms it.</li>
        </ul>
      </section>
    </div>
  );
}
