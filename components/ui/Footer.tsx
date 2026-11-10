import Link from 'next/link';
import { GraduationCap, ShieldCheck, Mail } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Scholarships', href: '/dashboard/scholarships' },
    { label: 'Eligibility Check', href: '/dashboard/eligibility' },
    { label: 'Document Vault', href: '/dashboard/documents' },
    { label: 'Application Tracker', href: '/dashboard/applications' },
  ],
  Resources: [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Security', href: '#security' },
    { label: 'Setup Guide', href: '/README.md' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/legal' },
    { label: 'Terms of Service', href: '/legal' },
    { label: 'Security Policy', href: '/legal' },
  ],
  Account: [
    { label: 'Sign Up Free', href: '/signup' },
    { label: 'Login', href: '/login' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Profile Setup', href: '/profile-setup' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-900">
      {/* Top gradient line */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-800" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-bold text-white">ClaimWise</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
              One Platform. Every Opportunity. AI-powered scholarship assistance for every Indian student.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-gray-400">
              <Mail className="h-4 w-4" />
              <a href="mailto:contact@claimwise.in" className="hover:text-white transition-colors">
                contact@claimwise.in
              </a>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-900 bg-green-950/40 px-4 py-2.5">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <p className="text-xs text-green-400">
                Documents secured with Supabase RLS + private storage
              </p>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 sm:flex-row">
          <p className="text-xs text-gray-500">
            © 2026 ClaimWise. All rights reserved. Built for Indian students. Demo version — not yet production-ready.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/legal" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/legal" className="hover:text-gray-300 transition-colors">Terms</Link>
            <span className="text-gray-600">|</span>
            <span className="text-blue-400">🔒 Supabase Auth · RLS · Private Storage</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
