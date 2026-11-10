'use client';

import Link from 'next/link';
import { ArrowRight, GraduationCap, FileText, Brain, CheckCircle2, Star } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/60 to-white pt-24 pb-20 sm:pt-32 sm:pb-28">
      {/* Background dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #bfdbfe 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          opacity: 0.5,
        }}
      />
      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-200 opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-10 h-[300px] w-[300px] rounded-full bg-indigo-200 opacity-20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left — text */}
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <Star className="h-4 w-4 fill-blue-500 text-blue-500" /> India&apos;s AI Scholarship Platform
            </span>

            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              <span className="text-blue-600">Your Documents.</span>
              <br />
              <span className="text-blue-600">Your Opportunities.</span>
              <br />
              <span className="text-gray-900">Your Future.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
              ClaimWise uses AI to help Indian students organise documents, discover scholarships,
              check eligibility and get step-by-step application assistance — all in one secure platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-7 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-blue-400 hover:text-blue-700"
              >
                Explore Features
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {[
                '🔒 Bank-level Security',
                '🤖 AI-Powered',
                '📚 500+ Scholarships',
                '🇮🇳 Built for India',
              ].map((badge) => (
                <span key={badge} className="flex items-center gap-1.5 text-sm text-gray-500">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="relative hidden lg:block">
            <div className="mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-3 flex-1 rounded bg-white px-3 py-1 text-xs text-gray-400">
                  claimwise.in/dashboard
                </span>
              </div>

              {/* Dashboard content */}
              <div className="p-5">
                {/* Welcome bar */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Welcome back, Priya! 👋</p>
                    <p className="text-xs text-gray-500">3 new scholarship matches found</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">75% profile complete</span>
                </div>

                {/* Stats row */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Documents', value: '6', color: 'bg-blue-50 text-blue-700' },
                    { label: 'Matched', value: '12', color: 'bg-green-50 text-green-700' },
                    { label: 'Applied', value: '2', color: 'bg-purple-50 text-purple-700' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-gray-100 p-3 text-center">
                      <p className={`text-lg font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
                      <p className="text-[10px] text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Scholarship cards */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Recommended Scholarships</p>
                  {[
                    { name: 'National Merit Scholarship', amount: '₹12,000/yr', status: 'OPEN', statusColor: 'bg-green-100 text-green-700' },
                    { name: 'Pragati Scholarship — AICTE', amount: '₹30,000/yr', status: 'OPEN', statusColor: 'bg-green-100 text-green-700' },
                    { name: 'Post Matric SC/ST Scholarship', amount: '₹3,500/mo', status: 'SOON', statusColor: 'bg-orange-100 text-orange-700' },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{s.name}</p>
                        <p className="text-[10px] text-blue-600 font-medium">{s.amount}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.statusColor}`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl border border-green-100 bg-white px-4 py-2.5 shadow-lg">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </span>
              <div>
                <p className="text-xs font-bold text-gray-800">AI Eligibility Check</p>
                <p className="text-[10px] text-gray-500">12 matches found for your profile</p>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2.5 shadow-lg">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                <Brain className="h-4 w-4 text-blue-600" />
              </span>
              <div>
                <p className="text-xs font-bold text-gray-800">AI Document Analysis</p>
                <p className="text-[10px] text-gray-500">Aadhaar extracted ✓</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
