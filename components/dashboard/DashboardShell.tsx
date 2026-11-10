'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  Wallet,
  ShieldCheck,
  PhoneCall,
  Users,
  Settings,
  Search,
  Target,
  BookmarkCheck,
  Menu,
  X,
  LogOut,
  Loader2,
  Sparkles,
  AlertOctagon,
  Download,
} from 'lucide-react';

interface SessionUser {
  id: string;
  email: string;
  name: string;
}

const NAV_GROUPS = [
  {
    label: 'Family Vault',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/documents', label: 'Documents', icon: FolderOpen },
      { href: '/dashboard/property', label: 'Property Details', icon: Building2 },
      { href: '/dashboard/financial', label: 'Financial Information', icon: Wallet },
      { href: '/dashboard/insurance', label: 'Insurance', icon: ShieldCheck },
      { href: '/dashboard/insurance/claim-advisor', label: 'Claim Advisor (AI)', icon: Sparkles },
      { href: '/dashboard/emergency-contacts', label: 'Emergency Contacts', icon: PhoneCall },
      { href: '/dashboard/emergency-sos', label: 'Emergency SOS 🚨', icon: AlertOctagon },
      { href: '/dashboard/family-access', label: 'Family Access', icon: Users },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    label: 'Scholarships',
    items: [
      { href: '/dashboard/scholarships', label: 'Explore Scholarships', icon: Search },
      { href: '/dashboard/eligibility', label: 'Eligibility Checker', icon: Target },
      { href: '/dashboard/saved-scholarships', label: 'Saved Scholarships', icon: BookmarkCheck },
    ],
  },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session')
      .then(async (r) => {
        if (!active) return;
        if (r.status === 401) {
          router.replace('/login');
          return;
        }
        const data = await r.json();
        if (active && data.success) setUser(data.user);
      })
      .catch(() => active && router.replace('/login'));
    return () => { active = false; };
  }, [router]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const initials = user?.name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  }

  const nav = (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400/80">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-purple-500/20 text-white ring-1 ring-inset ring-purple-400/30'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-purple-300' : 'text-blue-300'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-blue-950 bg-blue-950 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Image
            src="/claimwise-logo.png"
            alt="ClaimWise logo"
            width={788}
            height={695}
            className="h-10 w-auto shrink-0"
          />
          <div>
            <p className="text-base font-bold leading-none text-white">ClaimWise</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-purple-300">Family Vault</p>
          </div>
        </Link>

        <div className="px-3 pt-3">
          <Link
            href="/dashboard/emergency-sos"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/50 hover:from-red-500 hover:to-rose-500 transition-all hover:scale-[1.02]"
          >
            <AlertOctagon className="h-4 w-4 animate-bounce" />
            <span>Emergency SOS 🚨</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">{nav}</nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-blue-500 text-xs font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name ?? 'Your account'}</p>
              <p className="truncate text-[11px] text-blue-300">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              disabled={loggingOut}
              className="rounded-lg p-2 text-blue-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Log out"
              title="Log out"
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>

      <div className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/claimwise-logo.png"
            alt="ClaimWise logo"
            width={788}
            height={695}
            className="h-8 w-auto shrink-0"
          />
          <span className="text-base font-bold text-blue-950">ClaimWise</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/emergency-sos"
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700"
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>SOS</span>
          </Link>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-xl p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          className={`absolute left-0 right-0 top-14 overflow-hidden border-b border-gray-200 bg-blue-950 shadow-lg transition-all duration-200 ${
            mobileOpen ? 'max-h-[75vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="flex max-h-[70vh] flex-col overflow-y-auto px-3 py-3 scrollbar-thin">
            {nav}
            <div className="mt-2 border-t border-white/10 pt-3">
              <div className="mb-2 px-3 text-xs text-blue-300">{user?.email}</div>
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          </nav>
        </div>
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
