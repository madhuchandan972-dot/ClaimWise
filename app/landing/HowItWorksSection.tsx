import { FileText, Brain, GraduationCap, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    icon: FileText,
    step: '01',
    title: 'Upload Your Documents',
    text: 'Securely upload your Aadhaar, PAN, income certificate, marks cards and other certificates. ClaimWise stores them in a private vault only you can access.',
    color: 'bg-blue-600',
    lightColor: 'bg-blue-50 text-blue-700',
  },
  {
    icon: Brain,
    step: '02',
    title: 'AI Reads & Extracts',
    text: 'Our AI automatically reads your documents, extracts key information like name, income, marks and category, and builds your scholarship profile.',
    color: 'bg-purple-600',
    lightColor: 'bg-purple-50 text-purple-700',
  },
  {
    icon: GraduationCap,
    step: '03',
    title: 'Discover Scholarships',
    text: 'Get matched with government and private scholarships that fit your profile — with clear reasons why you qualify or what\'s missing.',
    color: 'bg-green-600',
    lightColor: 'bg-green-50 text-green-700',
  },
  {
    icon: CheckCircle,
    step: '04',
    title: 'Apply with Confidence',
    text: 'Our Application Assistant helps you prepare your application using your profile data, with a full review before you submit on the official portal.',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50 text-orange-700',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
            Simple 4-Step Process
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How ClaimWise Works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From document upload to scholarship application — all in one platform.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.step} className="relative">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="absolute top-8 left-full z-10 hidden h-0.5 w-6 bg-gray-200 lg:block" />
              )}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.lightColor}`}>
                    <step.icon className="h-6 w-6" />
                  </span>
                  <span className="text-3xl font-black text-gray-100">{step.step}</span>
                </div>
                <h3 className="mt-5 text-base font-bold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
