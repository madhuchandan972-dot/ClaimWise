'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ShieldCheck } from 'lucide-react';

const LINKS = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  { href: '#security', label: 'Security' },
  { href: '#scholarships', label: 'Scholarships' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? 'border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md' : 'bg-transparent'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-950">
              <span className="text-xs font-bold tracking-tight text-white">CW</span>
            </span>
            <span className="text-lg font-bold text-blue-950">ClaimWise</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:bg-blue-50 hover:text-blue-700' : 'text-gray-700 hover:bg-white/60 hover:text-blue-700'}`}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700">
              Login
            </Link>
            <Link href="/signup" className="rounded-xl bg-blue-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-900">
              Get Started
            </Link>
          </div>

          <button onClick={() => setMobileOpen((v) => !v)} className="rounded-xl p-2 text-gray-700 hover:bg-gray-100 md:hidden" aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-b border-gray-100 bg-white px-4 pb-4 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                {link.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-center text-sm font-semibold text-gray-700">Login</Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)} className="rounded-xl bg-blue-950 px-3 py-2.5 text-center text-sm font-semibold text-white">Get Started</Link>
            </div>
            <p className="mt-3 flex items-center gap-1.5 px-3 text-[11px] text-gray-400"><ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Private by default · RLS protected</p>
          </div>
        </div>
      )}
    </nav>
  );
}
