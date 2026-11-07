'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Loader2, UserPlus, MailCheck, ArrowLeft } from 'lucide-react';
import GoogleButton from '@/components/auth/GoogleButton';

interface FormState { name: string; email: string; password: string; confirm: string }
interface FormErrors extends Partial<Record<keyof FormState, string>> { general?: string }

const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
  }, []);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your full name';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!validateEmail(form.email)) errs.email = 'Enter a valid email address';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      errs.password = 'Use at least one letter and one number';
    }
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrors({ general: data.error ?? 'Could not create your account. Please try again.' });
        return;
      }
      if (data.needsConfirmation) {
        setConfirmationSent(true);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (err?: string) =>
    `w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 ${
      err ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
    }`;

  if (confirmationSent) {
    return (
      <div className="w-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <MailCheck className="h-7 w-7 text-green-600" />
        </span>
        <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          We sent a verification link to <b>{form.email}</b>. Open it to activate your account,
          then sign in. Your vault starts completely empty.
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Set up a private vault for your family.</p>
        </div>

        {errors.general && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-600">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">Full name</label>
            <input id="name" name="name" autoComplete="name" value={form.name} onChange={handleChange} placeholder="e.g. Ananya Rao" className={inputCls(errors.name)} />
            {errors.name && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" /> {errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputCls(errors.email)} />
            {errors.email && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" /> {errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={handleChange} placeholder="Min 8 characters, 1 letter + 1 number" className={`${inputCls(errors.password)} pr-11`} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" /> {errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-gray-700">Confirm password</label>
            <input id="confirm" name="confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirm} onChange={handleChange} placeholder="Re-enter your password" className={inputCls(errors.confirm)} />
            {errors.confirm && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" /> {errors.confirm}</p>}
          </div>

          <p className="text-xs leading-relaxed text-gray-400">
            Each account has a private vault. Data is protected by Supabase Auth, Postgres Row Level
            Security and a private storage bucket.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>) : (<><UserPlus className="h-4 w-4" /> Create Account</>)}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium text-gray-400">or continue with</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleButton label="Sign up with Google" />

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-800">Sign In</Link>
        </p>
      </div>
      <p className="mt-5 text-center text-xs leading-relaxed text-gray-400">
        Email verification is sent by Supabase Auth. Confirm your address before signing in.
      </p>
    </div>
  );
}
