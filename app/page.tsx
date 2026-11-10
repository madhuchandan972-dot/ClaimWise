import Link from 'next/link';
import {
  GraduationCap,
  FileText,
  Brain,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock,
  BookOpen,
  Star,
  Users,
  Lock,
  ChevronDown,
} from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import HeroSection from '@/app/landing/HeroSection';
import HowItWorksSection from '@/app/landing/HowItWorksSection';
import FeaturesSection from '@/app/landing/FeaturesSection';
import ScholarshipsSection from '@/app/landing/ScholarshipsSection';
import FAQSection from '@/app/landing/FAQSection';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ScholarshipsSection />

        {/* AI Assistant CTA Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" /> Powered by Gemini AI
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Your Personal AI Scholarship Assistant
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-blue-100">
              Tell ClaimWise about yourself once. Our AI reads your documents, matches you to scholarships,
              explains exactly why you qualify, and helps you prepare every application — step by step.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-blue-900 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
              >
                Start for Free
              </Link>
              <Link
                href="/dashboard/assistant"
                className="rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Try AI Assistant
              </Link>
            </div>
            <p className="mt-5 text-xs text-blue-200">No credit card required. Free for all students.</p>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="scroll-mt-20 bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
                  <Lock className="h-4 w-4" /> Bank-Level Security
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Your documents are safe with us
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-gray-600">
                  ClaimWise handles Aadhaar cards, income certificates and sensitive student documents.
                  Security is not optional — it is built into every layer.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    { icon: ShieldCheck, title: 'Row Level Security', text: 'Every record is scoped to your account at the database layer. Other users cannot see your data.' },
                    { icon: Lock, title: 'Private Document Storage', text: 'Files live in a private bucket. Documents are served only after a server-side access check.' },
                    { icon: Users, title: 'You Control Access', text: 'Only you can see your documents. No one else gets access unless you explicitly invite them.' },
                    { icon: FileText, title: 'No Sensitive Logs', text: 'We never log document contents, Aadhaar numbers or personal data in application logs.' },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-8">
                <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-800">
                  <ShieldCheck className="h-5 w-5 text-green-600" /> What we never do
                </h3>
                <ul className="space-y-3">
                  {[
                    'We never share your documents with third parties.',
                    'We never store Aadhaar numbers or PAN numbers as plain text.',
                    'We never submit scholarship applications without your review and approval.',
                    'We never claim documents are "100% hack-proof" — security needs continuous work.',
                    'We never store API keys or secrets in frontend code.',
                    'We never use localStorage for sessions — HttpOnly cookies only.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
                  💡 ClaimWise is built for Vercel + Supabase with Row Level Security enforced at the
                  database layer — not just the application layer.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why ClaimWise */}
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why ClaimWise?
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Thousands of scholarships go unclaimed every year because students don&apos;t know they qualify
                or don&apos;t know how to apply.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: BookOpen, stat: '500+', label: 'Scholarships catalogued', color: 'text-blue-600 bg-blue-50' },
                { icon: Star, stat: '₹2L+', label: 'Average scholarship value', color: 'text-purple-600 bg-purple-50' },
                { icon: Clock, stat: '< 10 min', label: 'To check your eligibility', color: 'text-green-600 bg-green-50' },
                { icon: GraduationCap, stat: '100%', label: 'Free for all students', color: 'text-orange-600 bg-orange-50' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center">
                  <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                    <item.icon className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-3xl font-bold text-gray-900">{item.stat}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQSection />

        {/* Final CTA */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Ready to find your scholarship?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Join thousands of Indian students who use ClaimWise to discover and apply for scholarships
              they actually qualify for.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn-primary">
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary">
                Sign In
              </Link>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Free for all students. No credit card required.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
