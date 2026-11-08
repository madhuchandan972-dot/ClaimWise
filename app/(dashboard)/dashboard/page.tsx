'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderOpen,
  Building2,
  PhoneCall,
  Users,
  ShieldCheck,
  Wallet,
  ArrowRight,
  Lock,
  CircleCheckBig,
  Circle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';

interface Overview {
  documents: number;
  properties: number;
  financialRecords: number;
  insuranceRecords: number;
  emergencyContacts: number;
  familyMembers: number;
  pendingInvitations: number;
  savedScholarships: number;
}

interface Response {
  success: boolean;
  overview: Overview;
  user: { name: string; email: string };
  error?: string;
}

const QUICK_ACTIONS = [
  { href: '/dashboard/documents', label: 'Upload a document', desc: 'Aadhaar, PAN, property, insurance and more', icon: FolderOpen },
  { href: '/dashboard/property', label: 'Add property', desc: 'Keep ownership and registration details safe', icon: Building2 },
  { href: '/dashboard/insurance', label: 'Add insurance', desc: 'Policies, numbers and expiry dates', icon: ShieldCheck },
  { href: '/dashboard/emergency-contacts', label: 'Add a contact', desc: 'Who to call in an emergency', icon: PhoneCall },
];

export default function DashboardPage() {
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/vault/overview')
      .then(async (r) => {
        const body = (await r.json()) as Response;
        if (!active) return;
        if (!r.ok || !body.success) {
          setError(body.error ?? 'Could not load your vault overview.');
          return;
        }
        setData(body);
      })
      .catch(() => active && setError('Network error while loading the vault overview.'));
    return () => { active = false; };
  }, []);

  // Deadline reminder sweep — idempotent on the server, so a refresh
  // just re-checks the same buckets and creates nothing new.
  useEffect(() => {
    fetch('/api/notifications/reminders', { cache: 'no-store' })
      .then((r) => r.json())
      .catch(() => {
        // Silent: reminders are a background nicety, never an error surface.
      });
  }, []);

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-red-700">The vault could not be loaded</p>
          <p className="mt-1 text-xs leading-relaxed text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      </div>
    );
  }

  const o = data.overview;
  const steps = [
    { label: 'Add at least one document', done: o.documents > 0, href: '/dashboard/documents' },
    { label: 'Record a property', done: o.properties > 0, href: '/dashboard/property' },
    { label: 'Record financial obligations', done: o.financialRecords > 0, href: '/dashboard/financial' },
    { label: 'Add insurance details', done: o.insuranceRecords > 0, href: '/dashboard/insurance' },
    { label: 'Add emergency contacts', done: o.emergencyContacts > 0, href: '/dashboard/emergency-contacts' },
    { label: 'Invite a trusted family member', done: o.familyMembers > 0, href: '/dashboard/family-access' },
  ];
  const completed = steps.filter((s) => s.done).length;
  const status =
    completed === 0 ? 'Not set up yet' : completed === steps.length ? 'Complete' : `${completed} of ${steps.length} areas covered`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Welcome, {data.user.name.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            This is your private family vault. Everything here belongs to your account.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
          <ShieldCheck className="h-3.5 w-3.5" /> Vault status: {status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Documents stored" value={o.documents} icon={<FolderOpen className="h-6 w-6" />} color="blue" />
        <StatsCard title="Property records" value={o.properties} icon={<Building2 className="h-6 w-6" />} color="purple" />
        <StatsCard title="Emergency contacts" value={o.emergencyContacts} icon={<PhoneCall className="h-6 w-6" />} color="green" />
        <StatsCard title="Family members with access" value={o.familyMembers} icon={<Users className="h-6 w-6" />} color="orange" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <CircleCheckBig className="h-4 w-4 text-blue-700" /> What your vault covers
            </h2>
            <span className="text-xs font-semibold text-gray-500">{completed}/{steps.length}</span>
          </div>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-700 to-purple-500"
              style={{ width: `${(completed / steps.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-2.5">
            {steps.map((step) => (
              <li key={step.label}>
                <Link href={step.href} className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-slate-50">
                  {step.done ? (
                    <CircleCheckBig className="h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                  )}
                  <span className={step.done ? 'text-gray-500 line-through' : 'font-medium text-gray-700'}>
                    {step.label}
                  </span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
          {completed === 0 && (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-gray-500">
              Your vault is empty — that is expected for a new account. Add only the information you
              choose; nothing is pre-filled.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-800">Other records</h2>
          <ul className="space-y-3">
            {[
              { label: 'Financial records', value: o.financialRecords, href: '/dashboard/financial', icon: Wallet },
              { label: 'Insurance policies', value: o.insuranceRecords, href: '/dashboard/insurance', icon: ShieldCheck },
              { label: 'Pending invitations', value: o.pendingInvitations, href: '/dashboard/family-access', icon: Users },
              { label: 'Saved scholarships', value: o.savedScholarships, href: '/dashboard/saved-scholarships', icon: BookmarkIcon },
            ].map((row) => (
              <li key={row.label}>
                <Link href={row.href} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 transition-colors hover:border-blue-200">
                  <row.icon className="h-4 w-4 text-blue-700" />
                  <span className="text-sm text-gray-700">{row.label}</span>
                  <span className="ml-auto text-sm font-bold text-gray-900">{row.value}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-gray-800">Quick actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-blue-200"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-950 group-hover:text-white">
                <action.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-blue-700" />
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
        <p className="text-xs leading-relaxed text-blue-800">
          Your records are private to your account. Accepted family members can only read your vault —
          they cannot edit or delete your records, and every request is checked on the server.
        </p>
      </div>
    </div>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return <BookmarkCheckIcon className={className} />;
}

function BookmarkCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
    </svg>
  );
}
