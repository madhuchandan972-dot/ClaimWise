'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Brain,
  GraduationCap,
  CheckCircle2,
  FileText,
  BarChart3,
  Bell,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  Loader2,
  Bookmark,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

interface SessionUser {
  id: string;
  email: string;
  name: string;
}

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
      { href: '/dashboard/profile', label: 'My Profile', icon: User },
    ],
  },
  {
    label: 'Documents',
    items: [
      { href: '/dashboard/documents', label: 'Document Vault', icon: FolderOpen },
      { href: '/dashboard/documents/intelligence', label: 'AI Analysis', icon: Brain },
    ],
  },
  {
    label: 'Scholarships',
    items: [
      { href: '/dashboard/scholarships', label: 'Discover Scholarships', icon: GraduationCap },
      { href: '/dashboard/eligibility', label: 'Eligibility Checker', icon: CheckCircle2 },
      { href: '/dashboard/saved-scholarships', label: 'Saved Scholarships', icon: Bookmark },
    ],
  },
  {
    label: 'Applications',
    items: [
      { href: '/dashboard/assistant', label: 'Application Assistant', icon: MessageSquare },
      { href: '/dashboard/applications', label: 'Application Tracker', icon: BarChart3 },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
      { href: '/dashboard/integrations', label: 'Integrations', icon: FileText },
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
        if (r.status === 401) { router.replace('/login'); return; }
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

  const navContent = (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400/70">
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
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-500/20 text-white ring-1 ring-inset ring-blue-400/30'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-blue-300' : 'text-blue-400'}`} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="h-3 w-3 text-blue-400" />}
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
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-blue-900 bg-blue-950 lg:flex">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900">
            <GraduationCap className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-base font-bold leading-none text-white">ClaimWise</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-blue-400">
              Scholarship Platform
            </p>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin">
          {navContent}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white shadow">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name ?? 'Loading…'}</p>
              <p className="truncate text-[11px] text-blue-400">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              disabled={loggingOut}
              className="rounded-lg p-1.5 text-blue-400 transition-colors hover:bg-white/10 hover:text-white"
              title="Log out"
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600">
            <GraduationCap className="h-4 w-4 text-white" />
          </span>
          <span className="text-base font-bold text-blue-950">ClaimWise</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/notifications" className="rounded-xl p-2 text-gray-700 hover:bg-gray-100">
            <Bell className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-xl p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        <div
          className={`absolute left-0 right-0 top-14 overflow-hidden border-b border-gray-200 bg-blue-950 shadow-xl transition-all duration-200 ${
            mobileOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="flex max-h-[75vh] flex-col overflow-y-auto px-3 py-4 scrollbar-thin">
            {navContent}
            <div className="mt-3 border-t border-white/10 pt-3">
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

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
