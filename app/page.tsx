import Link from 'next/link';
import {
  FolderLock,
  ShieldCheck,
  Users,
  FileText,
  Building2,
  Wallet,
  Shield,
  PhoneCall,
  GraduationCap,
  KeyRound,
  Database,
  ArrowRight,
  CheckCircle2,
  Lock,
  Search,
} from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

const FEATURES = [
  { icon: FileText, title: 'Documents', text: 'Aadhaar, PAN, property papers, insurance and bank documents in a private vault.' },
  { icon: Building2, title: 'Property details', text: 'Ownership, location and registration information for each property.' },
  { icon: Wallet, title: 'Financial obligations', text: 'Loans, debts and bank references your family should know about.' },
  { icon: Shield, title: 'Insurance', text: 'Provider, policy number, policyholder and expiry date in one place.' },
  { icon: PhoneCall, title: 'Emergency contacts', text: 'The people your family should be able to reach immediately.' },
  { icon: Users, title: 'Family access', text: 'Invite a trusted family member to read your vault. You stay in control.' },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50 to-white py-20 sm:py-28">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.4 }}
          />
          <div className="pointer-events-none absolute -top-32 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-purple-200 opacity-25 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700">
                <Lock className="h-4 w-4" /> Emergency Family Vault
              </span>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-blue-950 sm:text-5xl lg:text-6xl">
                Your Family&apos;s Important Information, Protected in One Place.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
                ClaimWise is a secure emergency family vault. Keep documents, property information,
                financial obligations, insurance details and emergency contacts together — so the right
                person can find them when it matters.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="/signup" className="rounded-xl bg-blue-950 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-900">
                  Get Started
                </Link>
                <Link href="/login" className="rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-400 hover:text-blue-700">
                  Login
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                {['Private by default', 'Supabase Auth', 'Row Level Security', 'Empty until you add data'].map((b) => (
                  <span key={b} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-600" /> {b}</span>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="mx-auto w-full max-w-[500px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 text-[11px] text-gray-400">ClaimWise · Family Vault</span>
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-blue-950">Your private vault</p>
                      <p className="text-[11px] text-gray-400">Starts completely empty</p>
                    </div>
                    <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700">SECURE</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Documents', value: '0' },
                      { label: 'Property', value: '0' },
                      { label: 'Contacts', value: '0' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <p className="text-lg font-bold text-blue-950">{s.value}</p>
                        <p className="text-[10px] text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {[
                    { icon: FileText, label: 'Documents', color: 'bg-blue-50 text-blue-700' },
                    { icon: Building2, label: 'Property details', color: 'bg-purple-50 text-purple-700' },
                    { icon: ShieldCheck, label: 'Insurance', color: 'bg-green-50 text-green-700' },
                    { icon: PhoneCall, label: 'Emergency contacts', color: 'bg-amber-50 text-amber-700' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${row.color}`}><row.icon className="h-4 w-4" /></span>
                      <span className="text-xs font-medium text-gray-700">{row.label}</span>
                      <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl border border-green-100 bg-white px-4 py-2.5 shadow-lg">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <p className="text-xs font-semibold text-gray-800">Private storage + RLS</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">How it works</h2>
              <p className="mt-4 text-lg text-gray-600">Three simple steps, no complicated setup.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { icon: Users, step: '01', title: 'Create your private account', text: 'Sign up with email and password or Google. Verify your email, then open your empty vault.' },
                { icon: FolderLock, step: '02', title: 'Add what matters', text: 'Upload documents and record property, financial, insurance and emergency contact details.' },
                { icon: KeyRound, step: '03', title: 'Invite someone you trust', text: 'Send an invitation to a family email. They accept it and get read-only access to your vault.' },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><item.icon className="h-5 w-5" /></span>
                    <span className="text-xs font-black text-purple-300">{item.step}</span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">Everything in one vault</h2>
              <p className="mt-4 text-lg text-gray-600">Six areas that cover the information a family usually scrambles to find.</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700"><feature.icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-base font-bold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="scroll-mt-20 bg-blue-950 py-20 text-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Security and privacy</h2>
              <p className="mt-4 text-lg leading-relaxed text-blue-200">
                Security is not a badge on this page — it is enforced by the database and server on every
                request.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { icon: Database, title: 'Row Level Security', text: 'Every user-specific table is scoped to the authenticated account at the database layer.' },
                  { icon: FolderLock, title: 'Private document storage', text: 'Files live in a private Supabase Storage bucket and are served only after an access check.' },
                  { icon: ShieldCheck, title: 'Server-side authorization', text: 'API routes verify the Supabase session before reading or writing any record.' },
                  { icon: Users, title: 'Explicit family access', text: 'Family members get read-only access only after accepting an invitation sent to their email.' },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10"><item.icon className="h-4 w-4 text-purple-300" /></span>
                    <div>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-blue-200">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Lock className="h-4 w-4 text-green-400" /> What we never do</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-blue-200">
                <li>• We never store your banking passwords, PINs, CVVs or OTPs.</li>
                <li>• We never create demo accounts or pre-fill your vault with fake records.</li>
                <li>• We never put the Supabase service-role key in browser code.</li>
                <li>• We never store authentication tokens in localStorage — sessions use HttpOnly cookies.</li>
                <li>• No automatic emergency access based on inactivity is enabled in this MVP.</li>
              </ul>
              <div className="mt-6 rounded-xl bg-white/10 p-4 text-xs leading-relaxed text-blue-100">
                You control your data. Add only what you choose, and revoke family access at any time
                from Family Access.
              </div>
            </div>
          </div>
        </section>

        <section id="scholarships" className="scroll-mt-20 bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 p-8 sm:p-10">
              <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-purple-700"><GraduationCap className="h-3.5 w-3.5" /> Scholarship Finder</span>
                  <h2 className="mt-3 text-2xl font-bold text-blue-950 sm:text-3xl">Students can find scholarships too.</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
                    ClaimWise also includes a scholarship discovery module. Enter your education level,
                    course, category and family income to see which verified listings you match — with a
                    transparent reason for every result. Save listings to review later.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/dashboard/scholarships" className="btn-primary">Explore scholarships</Link>
                    <Link href="/dashboard/eligibility" className="btn-secondary">Check eligibility</Link>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  {['Search by state, level, course, category and income', 'Eligible / possibly eligible / not eligible / more info', 'Verified dates and official source links', 'Saved scholarships tied to your account'].map((item) => (
                    <li key={item} className="flex items-start gap-2"><Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" /> {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-blue-950 sm:text-3xl">Start with an empty, private vault</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Create your account and add your family&apos;s information at your own pace. Nothing is
              pre-filled, and nothing is shared until you explicitly invite someone.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn-primary">Create your account</Link>
              <Link href="/login" className="btn-secondary">Sign in</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
