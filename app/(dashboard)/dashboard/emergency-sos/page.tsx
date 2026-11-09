'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  ArrowLeft,
  MapPin,
  Share2,
  Phone,
  Copy,
  Check,
  Loader2,
  ShieldAlert,
  Send,
  Navigation,
  HeartPulse,
  Flame,
  UserCheck,
  Building2,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

interface HealthInsurance {
  provider: string;
  policyType: string;
  policyNumber?: string;
  policyholderName?: string;
  expiryDate?: string;
}

interface SosData {
  user: {
    name: string;
    phone?: string;
    email: string;
    bloodGroup?: string;
  };
  contacts: Contact[];
  healthInsurance: HealthInsurance | null;
}

const EMERGENCY_HELPLINES = [
  { label: 'All-in-One Emergency', number: '112', icon: ShieldAlert, color: 'bg-red-600 text-white' },
  { label: 'Ambulance / Medical', number: '108', icon: HeartPulse, color: 'bg-emerald-600 text-white' },
  { label: 'Police Assistance', number: '100', icon: Phone, color: 'bg-blue-600 text-white' },
  { label: 'Fire Department', number: '101', icon: Flame, color: 'bg-orange-600 text-white' },
];

export default function EmergencySosPage() {
  const [data, setData] = useState<SosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/emergency-sos')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        } else {
          setError(res.error || 'Could not load emergency information.');
        }
      })
      .catch(() => setError('Network error while preparing SOS.'))
      .finally(() => setLoading(false));
  }, []);

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocError(err.message || 'Location access denied or unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function cleanPhoneForWhatsApp(phoneStr?: string): string {
    if (!phoneStr) return '';
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length === 10) return `91${digits}`;
    if (digits.startsWith('91') && digits.length === 12) return digits;
    return digits;
  }

  function generateMessage(): string {
    if (!data) return '';
    const lines: string[] = [];
    lines.push('🚨 *EMERGENCY SOS ALERT — ClaimWise* 🚨\n');
    lines.push(`*Name:* ${data.user.name}`);
    if (data.user.phone) lines.push(`*Phone:* ${data.user.phone}`);
    if (data.user.bloodGroup) lines.push(`*Blood Group:* ${data.user.bloodGroup}`);

    if (customNote.trim()) {
      lines.push(`\n⚠️ *Situation / Location Note:* ${customNote.trim()}`);
    }

    if (location) {
      lines.push(`\n📍 *Live GPS Pin:* https://maps.google.com/?q=${location.lat},${location.lng}`);
    }

    if (data.healthInsurance) {
      lines.push('\n🏥 *PRIMARY HEALTH INSURANCE:*');
      lines.push(`• Provider: ${data.healthInsurance.provider} (${data.healthInsurance.policyType})`);
      if (data.healthInsurance.policyNumber) {
        lines.push(`• Policy Number: ${data.healthInsurance.policyNumber}`);
      }
      if (data.healthInsurance.policyholderName) {
        lines.push(`• Policyholder: ${data.healthInsurance.policyholderName}`);
      }
    }

    if (data.contacts.length > 0) {
      lines.push('\n📞 *EMERGENCY CONTACTS ON RECORD:*');
      data.contacts.forEach((c, idx) => {
        lines.push(`${idx + 1}. ${c.name} (${c.relationship || 'Emergency Contact'}): ${c.phone || 'N/A'}`);
      });
    }

    lines.push('\n🙏 *Please coordinate or call immediately!*');
    return lines.join('\n');
  }

  const messageText = generateMessage();
  const encodedText = encodeURIComponent(messageText);

  function handleCopy() {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertOctagon className="mx-auto h-8 w-8 text-red-600 mb-2" />
        <h2 className="text-base font-bold text-red-900">Emergency System Error</h2>
        <p className="text-xs text-red-700 mt-1">{error || 'Could not initialize emergency dispatch.'}</p>
        <Link href="/dashboard" className="btn-secondary mt-4 inline-flex items-center gap-1.5 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          EMERGENCY DISPATCH READY
        </span>
      </div>

      {/* Main Alert Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-white shadow-xl shadow-red-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <AlertOctagon className="h-6 w-6 text-white" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  Instant Emergency SOS Broadcast
                </h1>
                <p className="text-xs text-red-100">
                  Send vital health insurance &amp; live GPS coordinates to all family contacts in 1 tap
                </p>
              </div>
            </div>
          </div>

          {/* Broadcast to Any WhatsApp Contact / Group Button */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-red-700 shadow-lg hover:bg-red-50 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
          >
            <Send className="h-4 w-4 text-emerald-600" />
            Broadcast to WhatsApp
          </a>
        </div>
      </div>

      {/* Step 1: Location & Context Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GPS Location Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-red-600" /> Live GPS Location
            </h2>
            {location && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Location Attached
              </span>
            )}
          </div>

          {location ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5 text-emerald-600" />
                Lat: {location.lat}, Lng: {location.lng}
              </p>
              <a
                href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-emerald-700 underline block"
              >
                Open Google Maps Pin ↗
              </a>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Attach your live GPS coordinates so emergency contacts and ambulances know your exact location.
            </p>
          )}

          <button
            onClick={handleGetLocation}
            disabled={locating}
            className="w-full btn-secondary flex items-center justify-center gap-2 !py-2.5 text-xs font-semibold"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-600" />
            ) : (
              <MapPin className="h-4 w-4 text-red-600" />
            )}
            {location ? 'Refresh GPS Coordinates' : '📍 Detect & Attach My Location'}
          </button>
          {locError && <p className="text-[11px] text-red-600">{locError}</p>}
        </div>

        {/* Emergency Note / Situation */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Emergency Note (Optional)
          </h2>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value.slice(0, 180))}
            placeholder="e.g. Admitted to ER at Apollo Hospital, Bannerghatta Road / Minor car accident on highway"
            rows={2}
            className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none shadow-inner"
          />
          <div className="flex flex-wrap gap-1.5">
            {[
              'Hospital Emergency',
              'Vehicle Accident',
              'Feeling Unwell',
              'Need Urgent Help',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => setCustomNote(chip)}
                className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: Emergency Contacts Direct WhatsApp Buttons */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              Direct WhatsApp to Emergency Contacts
            </h2>
            <p className="text-xs text-gray-500">
              Send this pre-filled emergency alert directly to specific family members
            </p>
          </div>
          <Link
            href="/dashboard/emergency-contacts"
            className="text-xs font-semibold text-blue-600 hover:underline shrink-0"
          >
            Manage Contacts
          </Link>
        </div>

        {data.contacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <p className="text-xs text-gray-500">No emergency contacts saved in your vault yet.</p>
            <Link
              href="/dashboard/emergency-contacts"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 underline"
            >
              Add emergency contacts now →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.contacts.map((contact) => {
              const cleanPhone = cleanPhoneForWhatsApp(contact.phone);
              const waUrl = cleanPhone
                ? `https://wa.me/${cleanPhone}?text=${encodedText}`
                : `https://api.whatsapp.com/send?text=${encodedText}`;

              return (
                <div
                  key={contact.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">{contact.name}</h3>
                    <p className="text-[11px] text-gray-500">
                      {contact.relationship || 'Emergency Contact'} · {contact.phone || 'No phone'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                    >
                      <Share2 className="h-3 w-3" /> WhatsApp
                    </a>
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 shadow-sm"
                        title={`Call ${contact.name}`}
                      >
                        <Phone className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 3: National Emergency Helplines (India) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Official Emergency Helplines (India)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {EMERGENCY_HELPLINES.map((h) => {
            const Icon = h.icon;
            return (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100 hover:border-gray-200 transition-all shadow-sm group"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${h.color} shadow-sm`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 font-medium truncate">{h.label}</p>
                  <p className="text-sm font-black text-gray-900 group-hover:text-red-600 transition-colors">
                    {h.number}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Step 4: Live Message Preview & Clipboard */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Live Message Preview (What will be sent)
          </h2>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy Message
              </>
            )}
          </button>
        </div>

        <pre className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs font-mono text-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto">
          {messageText}
        </pre>
      </div>
    </div>
  );
}
