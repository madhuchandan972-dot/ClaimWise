'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, MailCheck, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setSent(data.message as string);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
        {sent ? (
          <div className="text-center py-6">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <MailCheck className="h-7 w-7 text-green-600" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{sent}</p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
              <p className="mt-1 text-sm text-gray-500">
                Enter your account email and we&apos;ll send you a reset link.
              </p>
            </div>

            <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
              <p className="text-xs text-blue-600">
                <b>Note:</b> the reset link is delivered by Supabase Auth. Make sure email
                sending is configured on your Supabase project (SMTP is required in production).
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={handleChange} placeholder="you@example.com" className={`input-field ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`} />
                {error && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>) : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">← Back to Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
