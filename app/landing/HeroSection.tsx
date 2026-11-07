'use client';

import Link from 'next/link';

export default function HeroSection() {
  const handleScrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50 to-white py-20 sm:py-28 lg:py-36">
      {/* Dot grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.45,
        }}
      />

      {/* Soft blue blobs */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-200 opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-blue-300 opacity-10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left — text */}
          <div className="flex flex-col items-start">
            {/* Badge */}
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm">
              🎓 India&apos;s Most Intelligent Scholarship Platform
            </span>

            {/* Headline */}
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Your
              </span>{' '}
              Documents.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Your
              </span>{' '}
              Opportunities.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Your
              </span>{' '}
              Future.
            </h1>

            {/* Subheading */}
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
              ClaimWise uses AI to help Indian students organise documents,
              discover scholarships, check eligibility and get step-by-step
              application assistance — all in one secure platform.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95"
              >
                Get Started Free
              </Link>
              <button
                onClick={handleScrollToFeatures}
                className="rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-blue-400 hover:text-blue-600 hover:shadow-md active:scale-95"
              >
                Explore Features
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-500">
              {[
                '🔒 Bank-level Security',
                '🤖 AI-Powered',
                '📚 500+ Scholarships',
                '🇮🇳 Built for India',
              ].map((badge) => (
                <span key={badge} className="flex items-center gap-1 font-medium">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-gray-200 shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-xs text-gray-400">
                  claimwise.in/dashboard
                </div>
              </div>

              {/* Dashboard layout */}
              <div className="flex h-[380px] bg-gray-50">
                {/* Sidebar */}
                <div className="flex w-16 flex-col items-center gap-4 bg-blue-900 py-6">
                  <div className="h-8 w-8 rounded-lg bg-white/20" />
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-6 w-6 rounded-md ${i === 0 ? 'bg-white' : 'bg-white/20'}`}
                    />
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-hidden p-4">
                  {/* Stats row */}
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Matched', value: '14', color: 'bg-blue-50 border-blue-100' },
                      { label: 'Applied', value: '3', color: 'bg-green-50 border-green-100' },
                      { label: 'Documents', value: '8', color: 'bg-purple-50 border-purple-100' },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={`rounded-xl border p-3 ${stat.color}`}
                      >
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Section label */}
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">Recent Scholarships</p>
                    <div className="h-3 w-10 rounded bg-blue-200" />
                  </div>

                  {/* Scholarship rows */}
                  {[
                    { name: 'National Merit Scholarship', amt: '₹12,000', status: 'OPEN', color: 'bg-green-100 text-green-700' },
                    { name: 'Pragati Scholarship', amt: '₹30,000', status: 'UPCOMING', color: 'bg-blue-100 text-blue-700' },
                    { name: 'Post Matric SC/ST', amt: '₹3,500', status: 'CLOSING', color: 'bg-orange-100 text-orange-700' },
                  ].map((s) => (
                    <div
                      key={s.name}
                      className="mb-2 flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.amt}/year</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.color}`}>
                        {s.status}
                      </span>
                    </div>
                  ))}

                  {/* AI chat bubble */}
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                      AI
                    </div>
                    <p className="text-xs leading-snug text-blue-800">
                      You&apos;re eligible for 14 scholarships! Start with the National Merit Scholarship — deadline in 12 days.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl border border-green-100 bg-white px-4 py-2.5 shadow-lg">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm">✅</span>
              <div>
                <p className="text-xs font-semibold text-gray-800">Eligibility Verified</p>
                <p className="text-xs text-gray-500">3 new matches today</p>
              </div>
            </div>

            <div className="absolute -right-4 -top-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2.5 shadow-lg">
              <span className="text-sm">🤖</span>
              <p className="text-xs font-semibold text-gray-800">AI Assistant Ready</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
