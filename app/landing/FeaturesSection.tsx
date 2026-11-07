import {
  FolderOpen,
  Brain,
  Search,
  ShieldCheck,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';

const features = [
  {
    icon: FolderOpen,
    title: 'Document Vault',
    description:
      'Secure, organised storage for all your certificates, marks cards, and official documents. Access them anytime.',
    bgColor: 'bg-blue-600',
    lightBg: 'bg-blue-50',
  },
  {
    icon: Brain,
    title: 'AI Document Intelligence',
    description:
      'Automatic information extraction from your documents. No more manual form filling — AI reads it for you.',
    bgColor: 'bg-indigo-600',
    lightBg: 'bg-indigo-50',
  },
  {
    icon: Search,
    title: 'Scholarship Discovery',
    description:
      '500+ scholarships filtered and ranked by your academic profile, caste category, state, and income level.',
    bgColor: 'bg-violet-600',
    lightBg: 'bg-violet-50',
  },
  {
    icon: ShieldCheck,
    title: 'Smart Eligibility Check',
    description:
      'Know exactly why you qualify — or why you don\'t — for each scholarship, with a clear breakdown of every criterion.',
    bgColor: 'bg-green-600',
    lightBg: 'bg-green-50',
  },
  {
    icon: MessageSquare,
    title: 'Application Assistant',
    description:
      'Step-by-step AI guidance for preparing and reviewing your scholarship applications before submission.',
    bgColor: 'bg-orange-500',
    lightBg: 'bg-orange-50',
  },
  {
    icon: ClipboardList,
    title: 'Application Tracker',
    description:
      'Track all your scholarship applications — submitted, under review, approved, or disbursed — in one dashboard.',
    bgColor: 'bg-rose-600',
    lightBg: 'bg-rose-50',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
            Everything You Need
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
            Powerful Features, Built for Students
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            ClaimWise combines document management, AI intelligence, and
            scholarship discovery into one seamless platform.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                {/* Icon */}
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgColor} shadow-sm`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>

                {/* Text */}
                <h3 className="mb-2 text-lg font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>

                {/* Hover accent */}
                <div
                  className={`mt-5 h-0.5 w-0 rounded-full ${feature.bgColor} transition-all duration-300 group-hover:w-12`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
