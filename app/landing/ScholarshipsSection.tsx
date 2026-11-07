import Link from 'next/link';
import { ArrowRight, IndianRupee } from 'lucide-react';

// Sample data — clearly labeled for demo purposes
const sampleScholarships = [
  {
    id: 1,
    name: 'National Merit Scholarship',
    provider: 'Ministry of Education, Govt. of India',
    amount: '₹12,000',
    period: 'per year',
    category: 'Merit-based',
    status: 'OPEN',
    statusColor: 'bg-green-100 text-green-700 border-green-200',
    dotColor: 'bg-green-500',
    deadline: '31 Jan 2027',
    eligibility: 'Class 11–12 | Min 80%',
    icon: '🏆',
  },
  {
    id: 2,
    name: 'Pragati Scholarship for Girls',
    provider: 'AICTE — All India Council for Technical Education',
    amount: '₹30,000',
    period: 'per year',
    category: 'Gender-based',
    status: 'UPCOMING',
    statusColor: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
    deadline: '28 Feb 2027',
    eligibility: 'Female | Engineering | Family income < ₹8L',
    icon: '👩‍🎓',
  },
  {
    id: 3,
    name: 'Post Matric Scholarship',
    provider: 'Ministry of Social Justice & Empowerment',
    amount: '₹1,500–3,500',
    period: 'per month',
    category: 'SC/ST Category',
    status: 'CLOSING SOON',
    statusColor: 'bg-orange-100 text-orange-700 border-orange-200',
    dotColor: 'bg-orange-500',
    deadline: '13 Nov 2026',
    eligibility: 'SC / ST Category | Post Matric students',
    icon: '📋',
  },
];

export default function ScholarshipsSection() {
  return (
    <section id="scholarships" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 text-center">
          <span className="mb-3 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
            Scholarship Discovery
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
            Discover Scholarships Matched to You
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            ClaimWise analyses your profile and suggests the most relevant
            scholarships from 500+ central and state schemes.
          </p>
        </div>

        {/* Sample label */}
        <div className="mb-10 flex justify-center">
          <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            ⚠️ The cards below show sample data for illustration purposes
          </span>
        </div>

        {/* Scholarship cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sampleScholarships.map((scholarship) => (
            <div
              key={scholarship.id}
              className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Top row */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  {scholarship.icon}
                </div>
                <span
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${scholarship.statusColor}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${scholarship.dotColor}`} />
                  {scholarship.status}
                </span>
              </div>

              {/* Name & provider */}
              <h3 className="mb-1 text-base font-bold text-gray-900">
                {scholarship.name}
              </h3>
              <p className="mb-4 text-xs leading-relaxed text-gray-500">
                {scholarship.provider}
              </p>

              {/* Amount */}
              <div className="mb-4 flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-3">
                <IndianRupee className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="text-xl font-extrabold text-blue-700">
                    {scholarship.amount}
                  </span>
                  <span className="ml-1 text-xs text-blue-500">{scholarship.period}</span>
                </div>
              </div>

              {/* Eligibility */}
              <div className="mb-5 flex items-center gap-2 text-xs text-gray-500">
                <span className="rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-600">
                  {scholarship.category}
                </span>
                <span>{scholarship.eligibility}</span>
              </div>

              {/* Deadline */}
              <div className="mb-5 flex items-center justify-between text-xs text-gray-500">
                <span>Deadline</span>
                <span className="font-semibold text-gray-700">{scholarship.deadline}</span>
              </div>

              {/* CTA */}
              <div className="mt-auto">
                <Link
                  href="/dashboard/scholarships"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  View Details
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View all button */}
        <div className="mt-12 text-center">
          <Link
            href="/dashboard/scholarships"
            className="inline-flex items-center gap-2 rounded-xl border border-blue-600 px-8 py-3.5 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
          >
            View All Scholarships
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
