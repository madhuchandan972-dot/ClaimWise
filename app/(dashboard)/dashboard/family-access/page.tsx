'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Inbox,
} from 'lucide-react';
import type { FamilyInvitation, FamilyMember, SharedVault } from '@/lib/types';

interface FamilyData {
  invitations: FamilyInvitation[];
  members: FamilyMember[];
  received: FamilyInvitation[];
  shared: SharedVault[];
}

export default function FamilyAccessPage() {
  const [data, setData] = useState<FamilyData | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [inviting, setInviting] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/family');
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'Could not load family access.');
        setData({ invitations: [], members: [], received: [], shared: [] });
        return;
      }
      setData({
        invitations: body.invitations,
        members: body.members,
        received: body.received,
        shared: body.shared,
      });
      setError('');
    } catch {
      setError('Network error while loading family access.');
      setData({ invitations: [], members: [], received: [], shared: [] });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter a valid email address.');
      return;
    }
    setInviting(true);
    setFormError('');
    setNotice('');
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, relationship }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFormError(body.error ?? 'Could not send the invitation.');
        return;
      }
      setEmail('');
      setRelationship('');
      setNotice('Invitation created. The invited person must sign up or sign in with that email and accept it.');
      await load();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setInviting(false);
    }
  }

  async function revoke(id: string) {
    setBusyId(id);
    setNotice('');
    try {
      const res = await fetch(`/api/family/invitations/${id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'Could not revoke access.');
        return;
      }
      setNotice('Access revoked.');
      await load();
    } finally {
      setBusyId('');
    }
  }

  async function removeMember(id: string) {
    setBusyId(id);
    setNotice('');
    try {
      const res = await fetch(`/api/family/members/${id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'Could not remove the family member.');
        return;
      }
      setNotice('Family member removed.');
      await load();
    } finally {
      setBusyId('');
    }
  }

  async function accept(token: string) {
    setBusyId(token);
    setNotice('');
    setError('');
    try {
      const res = await fetch('/api/family/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error ?? 'Could not accept the invitation.');
        return;
      }
      setNotice('Invitation accepted. The shared vault is now available below.');
      await load();
    } finally {
      setBusyId('');
    }
  }

  const activeMembers = data?.members ?? [];
  const liveInvitations = (data?.invitations ?? []).filter((i) => i.status !== 'revoked');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Family Access</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Invite a trusted family member to <b>view</b> your vault. They cannot edit or delete your
          records. Access takes effect only after they accept with the invited email address.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-purple-700" />
        <p className="text-xs leading-relaxed text-purple-800">
          This is authenticated, invite-based access only. Automatic emergency access based on
          inactivity is not enabled in this MVP.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <p className="text-xs text-green-700">{notice}</p>
        </div>
      )}

      {/* Invitations received */}
      {(data?.received.length ?? 0) > 0 && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Inbox className="h-4 w-4 text-blue-700" /> Invitations waiting for you
          </h2>
          <div className="mt-3 space-y-2">
            {data?.received.map((invitation) => (
              <div key={invitation.id} className="flex flex-col gap-2 rounded-xl border border-blue-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {invitation.ownerEmail || 'A family member'} invited you
                  </p>
                  <p className="text-xs text-gray-500">
                    Listed as {invitation.relationship} · sent to {invitation.email}
                  </p>
                </div>
                <button
                  onClick={() => accept(invitation.token)}
                  disabled={busyId === invitation.token}
                  className="btn-primary !py-2 text-xs"
                >
                  {busyId === invitation.token ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Accept
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <UserPlus className="h-4 w-4 text-blue-700" /> Invite a trusted family member
        </h2>
        <form onSubmit={invite} className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
          <div>
            <label htmlFor="inviteEmail" className="label">Email address</label>
            <input id="inviteEmail" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFormError(''); }} className="input-field" placeholder="family@example.com" />
          </div>
          <div>
            <label htmlFor="inviteRelationship" className="label">Relationship</label>
            <input id="inviteRelationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} maxLength={80} className="input-field" placeholder="e.g. Spouse" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={inviting} className="btn-primary w-full sm:w-auto">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Invite
            </button>
          </div>
        </form>
        {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}
        <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
          The invitation is tied to this email. It cannot be accepted by a different account.
        </p>
      </section>

      {data === null ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-700" /></div>
      ) : (
        <>
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800">People with access ({activeMembers.length})</h2>
            {activeMembers.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No family members have access yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-50">
                {activeMembers.map((member) => (
                  <li key={member.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-700"><Users className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{member.email}</p>
                      <p className="text-xs text-gray-500">{member.relationship} · read-only access</p>
                    </div>
                    <button onClick={() => removeMember(member.id)} disabled={busyId === member.id} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                      {busyId === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800">Invitations sent ({liveInvitations.length})</h2>
            {liveInvitations.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">You have not invited anyone yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-50">
                {liveInvitations.map((invitation) => (
                  <li key={invitation.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{invitation.email}</p>
                      <p className="text-xs text-gray-500">
                        {invitation.relationship} · sent {new Date(invitation.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <span className={`badge self-start ${invitation.status === 'accepted' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {invitation.status === 'accepted' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                      {invitation.status}
                    </span>
                    <button onClick={() => revoke(invitation.id)} disabled={busyId === invitation.id} className="flex items-center gap-1 self-start rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                      {busyId === invitation.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />} Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800">Vaults shared with you</h2>
        {data === null ? (
          <div className="flex h-20 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-700" /></div>
        ) : data.shared.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">
            No one has shared a vault with you. When they invite this email and you accept, it appears here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.shared.map((vault) => (
              <li key={vault.ownerId}>
                <Link href={`/dashboard/shared/${vault.ownerId}`} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 transition-colors hover:border-blue-200">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700"><Users className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{vault.ownerName}</p>
                    <p className="text-xs text-gray-500">{vault.ownerEmail} · {vault.relationship}</p>
                  </div>
                  <span className="badge bg-gray-100 text-gray-600">Read-only</span>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
