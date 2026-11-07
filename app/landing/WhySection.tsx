import Link from 'next/link';
import { Check, X } from 'lucide-react';

const comparisons = [
  {
    point: 'Find scholarships that fit your profile',
    spreadsheets: false,
    claimwise: true,
  },
  {
    point: 'Know exactly why you qualify (or don\'t)',
    spreadsheets: false,
    claimwise: true,
  },
  {
    point: 'Documents organised and application-ready',
    spreadsheets: false,
    claimwise: true,
  },
  {
    point: 'Deadline and status tracking',
    spreadsheets: false,
    claimwise: true,
  },
  {
    point: 'You keep control of the final submission',
    spreadsheets: true,
    claimwise: true,
  },
];

const studentTypes = [
  { emoji: '🎒', title: 'First-generation college students', text: 'Get plain-language guidance through Government portals' },
  { emoji: '🏆', title: 'Merit scholars', text: 'Never miss a top-tier scholarship deadline again' },
  { emoji: '💼', title: 'Working students', text: 'Let the assistant prepare paperwork so you can apply in one focused review' },
  { emoji: '👩‍🎓', title: 'Girls in technical education', text: 'Discover AICTE and state schemes built for you' },
];

export default function WhySection() {
  return (
    <section id="why" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
            Why ClaimWise
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Scholarship hunting shouldn&apos;t be a second job
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Real scholarship portals are scattered across dozens of websites with
            different forms. ClaimWise brings the whole journey into one calm place.
          </p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Comparison table */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 grid grid-cols-3 gap-4 border-b border-gray-100 pb-4 text-sm font-bold text-gray-500">
              <span />
              <span className="text-center">Tracking it yourself</span>
              <span className="text-center text-blue-600">With ClaimWise</span>
            </div>
            <ul className="space-y-5">
              {comparisons.map((row) => (
                <li key={row.point} className="grid grid-cols-3 items-center gap-4">
                  <span className="text-sm text-gray-700">{row.point}</span>
                  <span className="flex justify-center">
                    {row.spreadsheets ? (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50">
                        <Check className="h-4 w-4 text-green-600" />
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                        <X className="h-4 w-4 text-gray-400" />
                      </span>
                    )}
                  </span>
                  <span className="flex justify-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">
                      <Check className="h-4 w-4 text-blue-600" />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Who it's for */}
          <div>
            <h3 className="text-xl font-bold text-gray-900">Built for students like</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {studentTypes.map((s) => (
                <div
                  key={s.title}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <h4 className="mt-3 text-sm font-bold text-gray-900">{s.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.text}</p>
                </div>
              ))}
            </div>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
            >
              Start free — no card needed
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
