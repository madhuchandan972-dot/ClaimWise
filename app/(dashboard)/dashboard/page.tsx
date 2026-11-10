'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderOpen,
  GraduationCap,
  FileText,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Clock,
  Star,
  Sparkles,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Upload,
  Search,
} from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';

interface Overview {
  documents: number;
  savedScholarships: number;
  applications?: number;
  notifications?: number;
}

interface ApiResponse {
  success: boolean;
  overview: Overview;
  user: { name: string; email: string };
  error?: string;
}

// Sample scholarships for dashboard (demo data)
const DEMO_SCHOLARSHIPS = [
  {
    id: 'nms',
    name: 'National Merit Scholarship',
    provider: 'Ministry of Education',
    amount: '₹12,000/year',
    deadline: '31 Jan 2027',
    status: 'OPEN',
    statusColor: 'bg-green-100 text-green-700',
    match: 92,
  },
  {
    id: 'pragati',
    name: 'Pragati Scholarship — AICTE',
    provider: 'AICTE',
    amount: '₹30,000/year',
    deadline: '15 Feb 2027',
    status: 'OPEN',
    statusColor: 'bg-green-100 text-green-700',
    match: 88,
  },
  {
    id: 'postmatric',
    name: 'Post Matric Scholarship SC/ST',
    provider: 'Ministry of Social Justice',
    amount: '₹3,500/month',
    deadline: '05 Dec 2026',
    status: 'CLOSING SOON',
    statusColor: 'bg-orange-100 text-orange-700',
    match: 76,
  },
];

const QUICK_ACTIONS = [
  { href: '/dashboard/documents', label: 'Upload Document', desc: 'Add Aadhaar, marks card, income certificate', icon: Upload, color: 'bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white' },
  { href: '/dashboard/scholarships', label: 'Find Scholarships', desc: 'Browse 500+ matched scholarships', icon: Search, color: 'bg-green-50 text-green-700 hover:bg-green-700 hover:text-white' },
  { href: '/dashboard/eligibility', label: 'Check Eligibility', desc: 'See which scholarships you qualify for', icon: CheckCircle2, color: 'bg-purple-50 text-purple-700 hover:bg-purple-700 hover:text-white' },
  { href: '/dashboard/assistant', label: 'Application Assistant', desc: 'Get AI help preparing your application', icon: MessageSquare, color: 'bg-orange-50 text-orange-700 hover:bg-orange-700 hover:text-white' },
];

const RECENT_ACTIVITY = [
  { icon: FolderOpen, text: 'Aadhaar Card uploaded successfully', time: '2 hours ago', color: 'text-blue-600 bg-blue-50' },
  { icon: CheckCircle2, text: 'Eligibility check completed — 12 matches', time: '5 hours ago', color: 'text-green-600 bg-green-50' },
  { icon: Star, text: 'National Merit Scholarship saved', time: 'Yesterday', color: 'text-amber-600 bg-amber-50' },
  { icon: FileText, text: 'Income Certificate processed by AI', time: '2 days ago', color: 'text-purple-600 bg-purple-50' },
  { icon: GraduationCap, text: 'Profile 75% complete', time: '3 days ago', color: 'text-indigo-600 bg-indigo-50' },
];

export default function DashboardPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/vault/overview')
      .then(async (r) => {
        const body = (await r.json()) as ApiResponse;
        if (!active) return;
        if (!r.ok || !body.success) {
          setError(body.error ?? 'Could not load your dashboard.');
          return;
        }
        setData(body);
      })
      .catch(() => active && setError('Network error. Please refresh.'));
    return () => { active = false; };
  }, []);

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-red-700">Dashboard could not be loaded</p>
          <p className="mt-1 text-xs leading-relaxed text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const firstName = data.user.name.split(' ')[0] || 'there';
  const o = data.overview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s your scholarship journey overview.
          </p>
        </div>
        <Link
          href="/dashboard/scholarships"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 self-start sm:self-auto"
        >
          <Sparkles className="h-4 w-4" /> Find Scholarships
        </Link>
      </div>

      {/* Profile completion banner */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-blue-900">Profile Completion — 75%</p>
              <span className="text-sm font-bold text-blue-700">75%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-blue-200">
              <div className="h-full w-3/4 rounded-full bg-blue-600" />
            </div>
            <p className="mt-2 text-xs text-blue-700">
              Complete your profile to improve scholarship matching accuracy.
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Complete Profile
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard
          title="Documents Uploaded"
          value={o.documents}
          icon={<FolderOpen className="h-6 w-6" />}
          color="blue"
          subtitle="in your vault"
        />
        <StatsCard
          title="Scholarships Matched"
          value={12}
          icon={<GraduationCap className="h-6 w-6" />}
          color="green"
          subtitle="based on your profile"
        />
        <StatsCard
          title="Applications"
          value={o.applications ?? 2}
          icon={<FileText className="h-6 w-6" />}
          color="purple"
          subtitle="in progress"
        />
        <StatsCard
          title="Saved Scholarships"
          value={o.savedScholarships}
          icon={<Star className="h-6 w-6" />}
          color="orange"
          subtitle="bookmarked"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-transparent hover:shadow-md"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommended scholarships */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Recommended Scholarships
            </h2>
            <Link href="/dashboard/scholarships" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {DEMO_SCHOLARSHIPS.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition-all hover:border-blue-100 hover:bg-blue-50/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.provider}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600">{s.amount}</span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" /> {s.deadline}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`block rounded-full px-2 py-0.5 text-[10px] font-bold ${s.statusColor}`}>
                    {s.status}
                  </span>
                  <p className="mt-1 text-xs text-green-600 font-semibold">{s.match}% match</p>
                </div>
                <Link
                  href={`/dashboard/scholarships/${s.id}`}
                  className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700"
                >
                  Apply
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-gray-400">
            * Sample data shown. <Link href="/dashboard/eligibility" className="text-blue-500 hover:underline">Run eligibility check</Link> for real matches.
          </p>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-800">Recent Activity</h2>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800">{item.text}</p>
                  <p className="text-[10px] text-gray-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/notifications"
            className="mt-5 flex items-center justify-center gap-1 rounded-xl border border-gray-100 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-blue-200 hover:text-blue-600"
          >
            View all activity <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-amber-800">
            <Clock className="h-4 w-4" /> Upcoming Deadlines
          </h2>
          <Link href="/dashboard/applications" className="text-xs font-medium text-amber-700 hover:text-amber-800">
            View tracker →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { name: 'Post Matric SC/ST', date: '05 Dec 2026', days: 25, urgent: true },
            { name: 'National Merit Scholarship', date: '31 Jan 2027', days: 82, urgent: false },
            { name: 'Pragati AICTE Scholarship', date: '15 Feb 2027', days: 97, urgent: false },
          ].map((d) => (
            <div key={d.name} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${d.urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {d.days}d
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-800">{d.name}</p>
                <p className="text-[10px] text-gray-500">{d.date}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-amber-700">* Sample deadlines shown for demonstration.</p>
      </div>
    </div>
  );
}
