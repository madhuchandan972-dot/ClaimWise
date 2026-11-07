'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  CalendarClock,
  FileWarning,
  RefreshCcw,
  Sparkles,
  BellOff,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/lib/types';

const TYPE_META: Record<NotificationType, { icon: typeof Bell; label: string; cls: string }> = {
  deadline: { icon: CalendarClock, label: 'Deadline', cls: 'bg-red-50 text-red-600' },
  'missing-doc': { icon: FileWarning, label: 'Missing document', cls: 'bg-amber-50 text-amber-600' },
  'status-update': { icon: RefreshCcw, label: 'Status update', cls: 'bg-blue-50 text-blue-600' },
  'new-match': { icon: Sparkles, label: 'New match', cls: 'bg-green-50 text-green-600' },
  reminder: { icon: Bell, label: 'Reminder', cls: 'bg-gray-100 text-gray-500' },
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/notifications');
    const d = await r.json();
    if (d.success) setItems(d.notifications as Notification[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAll() {
    setBusy(true);
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function markOne(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Notification Centre</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Deadlines, missing documents, application updates and new scholarship matches in one
            feed. Deadline reminders are generated automatically from your tracked applications
            (15, 8 and 3 days out, and the moment a deadline passes). Email delivery is next on the
            integration roadmap.
          </p>
        </div>
        <button onClick={markAll} disabled={busy || (items?.every((n) => n.read) ?? false)} className="btn-secondary !py-2.5 text-sm">
          {busy ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<BellOff className="h-4 w-4" />)}
          Mark all as read
        </button>
      </div>

      {items === null ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <Bell className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-semibold text-gray-700">Nothing here yet</p>
          <p className="mt-1 text-xs text-gray-500">Activity from your applications will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.reminder;
            const Icon = meta.icon;
            return (
              <li
                key={n.id}
                className={`flex items-start gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                  n.read ? 'border-gray-100 opacity-70' : 'border-blue-100'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.cls}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                    <p className={`text-sm ${n.read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>{n.title}</p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{n.message}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[10px] text-gray-400">
                      {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {n.link && (
                      <Link href={n.link} className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline">
                        Open <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                    {!n.read && (
                      <button onClick={() => markOne(n.id)} className="text-[11px] font-semibold text-gray-400 hover:text-gray-600">
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
