import Link from 'next/link';
import { Clock, ArrowRight, Building2, ExternalLink } from 'lucide-react';

// Sample scholarships — clearly labelled as demo data
const SAMPLE_SCHOLARSHIPS = [
  {
    id: 'nms-2025',
    name: 'National Merit Scholarship',
    provider: 'Ministry of Education, Govt. of India',
    amount: '₹12,000/year',
    status: 'OPEN',
    deadline: '31 Jan 2027',
    categories: ['Merit', 'All Categories'],
    statusColor: 'bg-green-100 text-green-700 border-green-200',
    borderColor: 'border-green-200',
  },
  {
    id: 'pragati-2025',
    name: 'Pragati Scholarship for Girls',
    provider: 'AICTE, Ministry of Education',
    amount: '₹30,000/year',
    status: 'OPEN',
    deadline: '15 Feb 2027',
    categories: ['Girls Only', 'Technical Education'],
    statusColor: 'bg-green-100 text-green-700 border-green-200',
    borderColor: 'border-green-200',
  },
  {
    id: 'postmatric-sc-2025',
    name: 'Post Matric Scholarship — SC/ST',
    provider: 'Ministry of Social Justice & Empowerment',
    amount: '₹1,500–₹3,500/month',
    status: 'CLOSING SOON',
    deadline: '05 Dec 2026',
    categories: ['SC/ST', 'All Courses'],
    statusColor: 'bg-orange-100 text-orange-700 border-orange-200',
    borderColor: 'border-orange-200',
  },
];

export default function ScholarshipsSection() {
  return (
    <section id="scholarships" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
            Scholarship Discovery
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Discover Scholarships Matched to You
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Browse 500+ central and state government scholarships. See which ones you qualify for — with reasons.
          </p>
        </div>

        {/* Sample scholarship cards */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_SCHOLARSHIPS.map((s) => (
            <div
              key={s.id}
              className={`relative rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${s.borderColor}`}
            >
              {/* Demo badge */}
              <span className="absolute top-3 left-3 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                SAMPLE
              </span>

              {/* Status badge */}
              <div className="flex justify-end">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${s.statusColor}`}>
                  {s.status}
                </span>
              </div>

              <h3 className="mt-2 text-base font-bold text-gray-900">{s.name}</h3>

              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{s.provider}</span>
              </div>

              <p className="mt-3 text-2xl font-bold text-blue-600">{s.amount}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.categories.map((cat) => (
                  <span key={cat} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {cat}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Deadline: {s.deadline}</span>
              </div>

              <div className="mt-5 flex gap-2">
                <Link
                  href="/signup"
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Check Eligibility
                </Link>
                <Link
                  href="/dashboard/scholarships"
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700"
                >
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/dashboard/scholarships"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-8 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            View All Scholarships <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-gray-400">
            * Sample data shown. Sign in to see scholarships matched to your actual profile.
          </p>
        </div>
      </div>
    </section>
  );
}
