// No 'use client' needed — purely presentational / static

const steps = [
  {
    number: '01',
    emoji: '📄',
    title: 'Upload Documents',
    description:
      'Securely upload your certificates, marks cards and income documents. ClaimWise stores them in an encrypted vault.',
    color: 'bg-blue-600',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    number: '02',
    emoji: '🤖',
    title: 'AI Analyses',
    description:
      'Our AI reads and extracts key information from your documents automatically — no manual data entry needed.',
    color: 'bg-indigo-600',
    lightColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  {
    number: '03',
    emoji: '🎓',
    title: 'Discover Scholarships',
    description:
      'Get matched with scholarships that fit your profile, caste category, income and academic performance.',
    color: 'bg-violet-600',
    lightColor: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    number: '04',
    emoji: '✅',
    title: 'Apply with Confidence',
    description:
      'Prepare applications with AI assistance, fill forms accurately and track every step until disbursement.',
    color: 'bg-green-600',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
            Simple Process
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
            How ClaimWise Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            From your first document upload to receiving scholarship funds — we
            guide you every step of the way.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop only) */}
          <div className="absolute left-0 right-0 top-14 hidden h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-green-200 lg:block" />

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Step circle */}
                <div
                  className={`relative z-10 mb-6 flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-white ${step.lightColor} shadow-lg`}
                >
                  <span className="text-3xl">{step.emoji}</span>
                  <span className={`mt-1 text-xs font-bold ${step.textColor}`}>
                    Step {step.number}
                  </span>
                </div>

                {/* Arrow between steps (desktop) */}
                {idx < steps.length - 1 && (
                  <div className="absolute right-0 top-14 z-20 hidden -translate-y-1/2 translate-x-1/2 lg:block">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                )}

                {/* Card */}
                <div className="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <h3 className="mb-2 text-lg font-bold text-gray-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
