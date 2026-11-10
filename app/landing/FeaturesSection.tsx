import {
  FolderOpen,
  Brain,
  GraduationCap,
  CheckCircle2,
  FileText,
  BarChart3,
  Bell,
  User,
  Search,
  Lock,
} from 'lucide-react';

const FEATURES = [
  {
    icon: FolderOpen,
    title: 'Document Vault',
    text: 'Upload and organise Aadhaar, PAN, income certificates, marks cards and more in a private, encrypted vault.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Brain,
    title: 'AI Document Intelligence',
    text: 'Our AI reads your documents and extracts names, dates, income figures and other key information automatically.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: GraduationCap,
    title: 'Scholarship Discovery',
    text: 'Browse 500+ central and state government scholarships. Filter by education level, category, state and deadline.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: CheckCircle2,
    title: 'Smart Eligibility Check',
    text: 'Know exactly which scholarships you qualify for and why — including what documents or information is missing.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: FileText,
    title: 'Application Assistant',
    text: 'Prepare scholarship applications using your profile data. Review every field before submitting on the official portal.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: BarChart3,
    title: 'Application Tracker',
    text: 'Track all your scholarship applications in one place — from preparation to submitted to approved.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: Bell,
    title: 'Deadline Reminders',
    text: 'Never miss a scholarship deadline. ClaimWise surfaces upcoming deadlines and sends smart reminders.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Search,
    title: 'DigiLocker Integration',
    text: 'Connect your DigiLocker account to automatically import government-verified documents into your vault.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    text: 'Row-level security ensures only you can access your data. No ads, no data selling, no surprises.',
    color: 'bg-slate-50 text-slate-600',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
            Everything You Need
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            One Platform. Every Opportunity.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            ClaimWise brings together all the tools a student needs to discover and apply for scholarships.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}>
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
