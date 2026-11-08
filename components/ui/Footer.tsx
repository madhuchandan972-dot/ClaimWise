import Link from 'next/link';
import Image from 'next/image';
import { Lock } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Features', href: '/#features' },
    { label: 'Security', href: '/#security' },
    { label: 'Scholarships', href: '/#scholarships' },
  ],
  Account: [
    { label: 'Create account', href: '/signup' },
    { label: 'Login', href: '/login' },
    { label: 'Forgot password', href: '/forgot-password' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  Legal: [
    { label: 'Privacy & Terms', href: '/legal' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-blue-950 text-blue-200">
      <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-purple-500 to-blue-800" />
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <Image
                src="/claimwise-logo.png"
                alt="ClaimWise logo"
                width={788}
                height={695}
                className="h-9 w-auto shrink-0"
              />
              <span className="text-lg font-bold text-white">ClaimWise</span>
            </Link>
            <p className="text-sm font-medium text-blue-100">Emergency Family Vault</p>
            <p className="mt-3 text-xs leading-relaxed text-blue-300">
              Keep your family&apos;s important information organised and private, with scholarship
              discovery for students.
            </p>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{group}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-blue-300 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row">
          <div className="flex items-center gap-1.5 text-xs text-blue-300">
            <Lock className="h-3 w-3 text-green-400" />
            <span>Private storage, Row Level Security and server-verified sessions</span>
          </div>
          <p className="text-center text-xs text-blue-400">
            © 2026 ClaimWise · v1.1.0. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
