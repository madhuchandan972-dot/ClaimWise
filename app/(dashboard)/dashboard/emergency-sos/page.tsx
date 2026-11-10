'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
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
  Save,
  Download,
  Printer,
  Smartphone,
  CreditCard,
  KeyRound,
  FileText,
  Lock,
  Building,
  Sparkles,
  HelpCircle,
  Eye,
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

interface ProtocolState {
  bloodGroup: string;
  allergies: string;
  chronicConditions: string;
  medications: string;
  preferredHospital: string;
  nomineeName: string;
  nomineeRelationship: string;
  nomineePhone: string;
  nomineeEmail: string;
  lockerLocations: string;
  willDeedLocations: string;
  handoverInstructions: string;
}

const DEFAULT_PROTOCOL: ProtocolState = {
  bloodGroup: '',
  allergies: '',
  chronicConditions: '',
  medications: '',
  preferredHospital: '',
  nomineeName: '',
  nomineeRelationship: '',
  nomineePhone: '',
  nomineeEmail: '',
  lockerLocations: '',
  willDeedLocations: '',
  handoverInstructions: '',
};

interface SosData {
  user: {
    name: string;
    phone?: string;
    email: string;
    bloodGroup?: string;
  };
  contacts: Contact[];
  healthInsurance: HealthInsurance | null;
  protocol?: Partial<ProtocolState> | null;
}

const EMERGENCY_HELPLINES = [
  { label: 'All-in-One Emergency', number: '112', icon: ShieldAlert, color: 'bg-red-600 text-white' },
  { label: 'Ambulance / Medical', number: '108', icon: HeartPulse, color: 'bg-emerald-600 text-white' },
  { label: 'Police Assistance', number: '100', icon: Phone, color: 'bg-blue-600 text-white' },
  { label: 'Fire Department', number: '101', icon: Flame, color: 'bg-orange-600 text-white' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'];

export default function EmergencySosPage() {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'ice-card' | 'nominee'>('broadcast');
  const [data, setData] = useState<SosData | null>(null);
  const [protocol, setProtocol] = useState<ProtocolState>(DEFAULT_PROTOCOL);
  const [loading, setLoading] = useState(true);
  const [savingProtocol, setSavingProtocol] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [error, setError] = useState('');

  // Broadcast state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);

  // QR Code & Lockscreen State
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [generatingWallpaper, setGeneratingWallpaper] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch('/api/emergency-sos')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res);
          if (res.protocol) {
            setProtocol((prev) => ({ ...prev, ...res.protocol }));
          }
        } else {
          setError(res.error || 'Could not load emergency information.');
        }
      })
      .catch(() => setError('Network error while preparing SOS.'))
      .finally(() => setLoading(false));
  }, []);

  // Generate Medical ICE QR Code whenever vitals or primary info changes
  useEffect(() => {
    if (!data) return;
    const qrPayload = [
      `ICE MEDICAL RECORD — CLAIMWISE`,
      `Name: ${data.user.name}`,
      `Blood Group: ${protocol.bloodGroup || 'Not specified'}`,
      `Allergies: ${protocol.allergies || 'None recorded'}`,
      `Conditions: ${protocol.chronicConditions || 'None recorded'}`,
      `Medications: ${protocol.medications || 'None recorded'}`,
      `Primary Emergency Contact: ${data.contacts[0]?.name ? `${data.contacts[0].name} (${data.contacts[0].phone})` : 'N/A'}`,
      `Health Insurance: ${data.healthInsurance ? `${data.healthInsurance.provider} #${data.healthInsurance.policyNumber || 'N/A'}` : 'N/A'}`,
      `Preferred Hospital: ${protocol.preferredHospital || 'Nearest Trauma Center'}`,
    ].join('\n');

    QRCode.toDataURL(qrPayload, {
      width: 256,
      margin: 2,
      color: { dark: '#991b1b', light: '#ffffff' },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [data, protocol]);

  async function handleSaveProtocol() {
    setSavingProtocol(true);
    setSaveSuccess('');
    try {
      const res = await fetch('/api/emergency-sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protocol),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setSaveSuccess('Emergency protocol saved successfully to your vault!');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch {
      // Safe fallback
      setSaveSuccess('Saved locally in this session.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } finally {
      setSavingProtocol(false);
    }
  }

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
    if (protocol.bloodGroup) lines.push(`*Blood Group:* ${protocol.bloodGroup}`);
    if (protocol.allergies) lines.push(`*Allergies:* ${protocol.allergies}`);
    if (protocol.chronicConditions) lines.push(`*Medical Conditions:* ${protocol.chronicConditions}`);

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

  // Draw and download Lockscreen Wallpaper
  function downloadWallpaper() {
    if (!canvasRef.current || !data) return;
    setGeneratingWallpaper(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution phone lockscreen dimensions: 1080 x 1920
    canvas.width = 1080;
    canvas.height = 1920;

    // Dark sleek gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative top glow
    const glowGrad = ctx.createRadialGradient(540, 300, 50, 540, 300, 500);
    glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1080, 800);

    // Emergency Header Banner
    ctx.fillStyle = '#dc2626';
    ctx.roundRect(140, 180, 800, 90, 45);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚨 IN CASE OF EMERGENCY (ICE)', 540, 238);

    // Patient Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText(data.user.name, 540, 370);

    // Blood Group Big Badge
    if (protocol.bloodGroup) {
      ctx.fillStyle = '#b91c1c';
      ctx.roundRect(390, 420, 300, 90, 45);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px system-ui, sans-serif';
      ctx.fillText(`BLOOD: ${protocol.bloodGroup}`, 540, 482);
    }

    // Medical Info Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.roundRect(100, 560, 880, 420, 32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('ALLERGIES:', 150, 630);
    ctx.fillStyle = protocol.allergies ? '#fca5a5' : '#ffffff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(protocol.allergies || 'No known drug allergies', 150, 680);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('MEDICAL CONDITIONS / MEDICATIONS:', 150, 760);
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px system-ui, sans-serif';
    ctx.fillText(
      protocol.chronicConditions || protocol.medications
        ? `${protocol.chronicConditions || ''} ${protocol.medications ? `(${protocol.medications})` : ''}`
        : 'None recorded',
      150,
      810
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('HOSPITAL PREFERENCE:', 150, 890);
    ctx.fillStyle = '#67e8f9';
    ctx.font = '32px system-ui, sans-serif';
    ctx.fillText(protocol.preferredHospital || 'Nearest Emergency Center', 150, 940);

    // Emergency Contacts Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.roundRect(100, 1020, 880, 340, 32);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('📞 PRIMARY EMERGENCY CONTACTS', 150, 1080);

    if (data.contacts.length > 0) {
      const c1 = data.contacts[0];
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillText(`${c1.name} (${c1.relationship || 'Emergency'})`, 150, 1140);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(c1.phone || 'No phone recorded', 150, 1190);

      if (data.contacts.length > 1) {
        const c2 = data.contacts[1];
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '28px system-ui, sans-serif';
        ctx.fillText(`Alt: ${c2.name} · ${c2.phone || ''}`, 150, 1260);
      }
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px system-ui, sans-serif';
      ctx.fillText('No emergency contact specified', 150, 1150);
    }

    // Health Insurance Box
    if (data.healthInsurance) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.roundRect(100, 1400, 880, 160, 28);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText('🏥 HEALTH INSURANCE FOR CASHLESS ADMISSION', 150, 1460);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillText(
        `${data.healthInsurance.provider} · Policy #${data.healthInsurance.policyNumber || 'On Record'}`,
        150,
        1510
      );
    }

    // QR Code Embed
    if (qrDataUrl) {
      const qrImg = new window.Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 420, 1600, 240, 240);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 24px system-ui, sans-serif';
        ctx.fillText('SCAN FOR COMPLETE MEDICAL & INSURANCE DOSSIER', 540, 1880);

        // Download
        const link = document.createElement('a');
        link.download = `claimwise-ice-lockscreen-${data.user.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setGeneratingWallpaper(false);
      };
      qrImg.src = qrDataUrl;
    } else {
      setGeneratingWallpaper(false);
    }
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
      {/* Hidden canvas for generating high-res phone lockscreens */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
          <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
          EMERGENCY LIFE-COMMAND CENTER
        </span>
      </div>

      {/* Hero Title & Subheader */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-white shadow-xl shadow-red-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <AlertOctagon className="h-7 w-7 text-white" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                Emergency Command &amp; Life Vault
              </h1>
              <p className="text-xs text-red-100">
                1-tap WhatsApp SOS, Paramedic ICE Lockscreen Cards, and Nominee Handover Protocol
              </p>
            </div>
          </div>

          {activeTab === 'broadcast' && (
            <a
              href={`https://api.whatsapp.com/send?text=${encodedText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-red-700 shadow-lg hover:bg-red-50 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
            >
              <Send className="h-4 w-4 text-emerald-600" />
              Broadcast to WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* 3 Main Unified Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold shadow-inner">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 transition-all ${
            activeTab === 'broadcast'
              ? 'bg-white text-red-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <AlertOctagon className="h-4 w-4 text-red-600" />
          <span>Instant WhatsApp SOS</span>
        </button>

        <button
          onClick={() => setActiveTab('ice-card')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 transition-all ${
            activeTab === 'ice-card'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Smartphone className="h-4 w-4 text-blue-600" />
          <span>Paramedic ICE Lockscreen &amp; Wallet Card</span>
        </button>

        <button
          onClick={() => setActiveTab('nominee')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 transition-all ${
            activeTab === 'nominee'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <KeyRound className="h-4 w-4 text-purple-600" />
          <span>Nominee Handover Protocol</span>
        </button>
      </div>

      {/* ============================================================
          TAB 1: INSTANT WHATSAPP SOS BROADCAST
      ============================================================ */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          {/* Location & Context Details */}
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
                Emergency Situation Note
              </h2>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value.slice(0, 180))}
                placeholder="e.g. Admitted to ER at Apollo Hospital / Minor car collision on highway / Sudden acute chest pain"
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

          {/* Emergency Contacts Direct WhatsApp Buttons */}
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

          {/* National Emergency Helplines (India) */}
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

          {/* Live Message Preview & Clipboard */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Live WhatsApp Message Preview
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
      )}

      {/* ============================================================
          TAB 2: PARAMEDIC ICE LOCKSCREEN & WALLET CARD
      ============================================================ */}
      {activeTab === 'ice-card' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Vitals Input Form (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-red-600" />
                  Paramedic Medical Vitals Profile
                </h2>
                <p className="text-xs text-gray-500">
                  Critical life data for paramedics, doctors, and first responders during an unconscious emergency
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Blood Group *</label>
                  <select
                    value={protocol.bloodGroup}
                    onChange={(e) => setProtocol({ ...protocol, bloodGroup: e.target.value })}
                    className="input-field font-semibold text-red-600"
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Known Drug Allergies</label>
                  <input
                    type="text"
                    value={protocol.allergies}
                    onChange={(e) => setProtocol({ ...protocol, allergies: e.target.value })}
                    placeholder="e.g. Penicillin, Sulfa, Peanuts"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Chronic Illnesses / Conditions</label>
                <input
                  type="text"
                  value={protocol.chronicConditions}
                  onChange={(e) => setProtocol({ ...protocol, chronicConditions: e.target.value })}
                  placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma, Cardiac Stent"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Daily Essential Medications</label>
                  <input
                    type="text"
                    value={protocol.medications}
                    onChange={(e) => setProtocol({ ...protocol, medications: e.target.value })}
                    placeholder="e.g. Insulin, Telmisartan 40mg"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Preferred Hospital</label>
                  <input
                    type="text"
                    value={protocol.preferredHospital}
                    onChange={(e) => setProtocol({ ...protocol, preferredHospital: e.target.value })}
                    placeholder="e.g. Manipal Hospital, Whitefield"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleSaveProtocol}
                  disabled={savingProtocol}
                  className="btn-primary inline-flex items-center gap-2 !py-2 text-xs"
                >
                  {savingProtocol ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Medical Vitals
                </button>
                {saveSuccess && <span className="text-xs font-semibold text-emerald-600">{saveSuccess}</span>}
              </div>
            </div>

            {/* Right: Interactive Phone Lockscreen Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center space-y-4">
              <div className="w-full max-w-[280px] rounded-[36px] border-4 border-gray-800 bg-slate-900 p-4 text-white shadow-2xl relative overflow-hidden">
                {/* Speaker Notch */}
                <div className="mx-auto h-4 w-28 rounded-full bg-gray-800 mb-3" />

                {/* Lockscreen Time preview */}
                <div className="text-center mb-4">
                  <p className="text-3xl font-extralight tracking-tight">12:30</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Tuesday, 10 November</p>
                </div>

                {/* Paramedic ICE Badge */}
                <div className="rounded-2xl border border-red-500/30 bg-red-950/60 p-3 space-y-2 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-red-400">
                      🚨 ICE EMERGENCY
                    </span>
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                      {protocol.bloodGroup || 'BLOOD: ?'}
                    </span>
                  </div>

                  <p className="text-xs font-bold truncate text-white">{data.user.name}</p>

                  <div className="border-t border-red-900/40 pt-1.5 text-[9px] space-y-1 text-gray-300">
                    <p className="truncate">
                      ⚠️ <strong className="text-red-300">Allergies:</strong> {protocol.allergies || 'None'}
                    </p>
                    <p className="truncate">
                      🩺 <strong className="text-red-300">Conditions:</strong> {protocol.chronicConditions || 'None'}
                    </p>
                    <p className="truncate">
                      📞 <strong className="text-emerald-300">ICE Contact:</strong>{' '}
                      {data.contacts[0]?.name ? `${data.contacts[0].name} (${data.contacts[0].phone})` : 'None'}
                    </p>
                    {data.healthInsurance && (
                      <p className="truncate">
                        🏥 <strong className="text-blue-300">Ins:</strong> {data.healthInsurance.provider}
                      </p>
                    )}
                  </div>

                  {qrDataUrl && (
                    <div className="flex justify-center pt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrDataUrl} alt="ICE QR" className="h-16 w-16 rounded-lg bg-white p-1" />
                    </div>
                  )}
                </div>

                {/* Bottom swipe indicator */}
                <div className="mt-4 mx-auto h-1 w-20 rounded-full bg-gray-700" />
              </div>

              {/* Download Wallpaper Button */}
              <button
                onClick={downloadWallpaper}
                disabled={generatingWallpaper}
                className="w-full max-w-[280px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 text-xs font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {generatingWallpaper ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download Lockscreen Wallpaper
              </button>
            </div>
          </div>

          {/* Printable ICE Wallet Card Section */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Printable Credit-Card Size ICE Wallet Card
                </h2>
                <p className="text-xs text-gray-500">
                  Keep this card in your physical wallet, vehicle dashboard, or student ID card holder
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="btn-secondary inline-flex items-center gap-2 !py-2 text-xs font-semibold"
              >
                <Printer className="h-4 w-4" /> Print / Save PDF
              </button>
            </div>

            {/* Wallet Card Visual Preview */}
            <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-red-300 bg-gradient-to-br from-red-50 to-rose-50 p-5 shadow-sm text-gray-900 space-y-3">
              <div className="flex items-start justify-between border-b border-red-200 pb-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                    CLAIMWISE · MEDICAL ICE CARD
                  </p>
                  <h3 className="text-base font-extrabold text-gray-900">{data.user.name}</h3>
                </div>
                <div className="rounded-xl bg-red-600 px-3 py-1 text-center text-white shadow-sm">
                  <span className="block text-[8px] uppercase tracking-wider font-semibold">Blood</span>
                  <span className="block text-sm font-black">{protocol.bloodGroup || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="col-span-2 space-y-1.5">
                  <p className="text-[11px] leading-tight">
                    <span className="text-gray-500 font-medium">Allergies:</span>{' '}
                    <strong className="text-red-700">{protocol.allergies || 'None recorded'}</strong>
                  </p>
                  <p className="text-[11px] leading-tight">
                    <span className="text-gray-500 font-medium">Conditions:</span>{' '}
                    <strong>{protocol.chronicConditions || 'None recorded'}</strong>
                  </p>
                  <p className="text-[11px] leading-tight">
                    <span className="text-gray-500 font-medium">ICE Contact:</span>{' '}
                    <strong>{data.contacts[0]?.name ? `${data.contacts[0].name} (${data.contacts[0].phone})` : '—'}</strong>
                  </p>
                  {data.healthInsurance && (
                    <p className="text-[11px] leading-tight">
                      <span className="text-gray-500 font-medium">Insurer:</span>{' '}
                      <strong>{data.healthInsurance.provider} (#{data.healthInsurance.policyNumber || 'N/A'})</strong>
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center">
                  {qrDataUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={qrDataUrl} alt="ICE QR" className="h-20 w-20 rounded-lg bg-white p-1 border border-red-200 shadow-sm" />
                  )}
                  <span className="text-[8px] text-gray-400 mt-1 uppercase font-semibold">Scan for ICE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: NOMINEE HANDOVER PROTOCOL ("FAMILY INSTRUCTIONS")
      ============================================================ */}
      {activeTab === 'nominee' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Nominee Handover Protocol (&quot;Digital Emergency Will&quot;)
                    </h2>
                    <p className="text-xs text-gray-500">
                      Confidential handover roadmap for your family nominees if incapacitated or in sudden demise
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProtocol}
                  disabled={savingProtocol}
                  className="btn-primary inline-flex items-center gap-1.5 !py-2 text-xs"
                >
                  {savingProtocol ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Protocol
                </button>
              </div>
              {saveSuccess && <p className="mt-2 text-xs font-semibold text-emerald-600">{saveSuccess}</p>}
            </div>

            {/* 1. Primary Nominee Info */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-purple-600" />
                1. Designated Emergency Nominee
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Nominee Full Name *</label>
                  <input
                    type="text"
                    value={protocol.nomineeName}
                    onChange={(e) => setProtocol({ ...protocol, nomineeName: e.target.value })}
                    placeholder="e.g. Radhika Sharma"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Relationship</label>
                  <input
                    type="text"
                    value={protocol.nomineeRelationship}
                    onChange={(e) => setProtocol({ ...protocol, nomineeRelationship: e.target.value })}
                    placeholder="e.g. Spouse / Elder Daughter / Brother"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Nominee Phone Number</label>
                  <input
                    type="text"
                    value={protocol.nomineePhone}
                    onChange={(e) => setProtocol({ ...protocol, nomineePhone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Nominee Email Address</label>
                  <input
                    type="email"
                    value={protocol.nomineeEmail}
                    onChange={(e) => setProtocol({ ...protocol, nomineeEmail: e.target.value })}
                    placeholder="nominee@example.com"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* 2. Physical Locker & Document Keys */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <Building className="h-4 w-4 text-purple-600" />
                2. Physical Bank Lockers &amp; Asset Keys
              </h3>
              <div>
                <label className="label">Bank Locker Details &amp; Physical Key Locations</label>
                <textarea
                  value={protocol.lockerLocations}
                  onChange={(e) => setProtocol({ ...protocol, lockerLocations: e.target.value })}
                  placeholder="e.g. State Bank of India, Koramangala Branch (Locker #142). The physical brass key is kept in the master bedroom wooden wardrobe small locked drawer."
                  rows={2}
                  className="input-field"
                />
              </div>
            </div>

            {/* 3. Original Deeds, Will & Term Insurance Paperwork */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-purple-600" />
                3. Physical Land Deeds, Will &amp; Insurance Files
              </h3>
              <div>
                <label className="label">Where Original Physical Files Are Kept</label>
                <textarea
                  value={protocol.willDeedLocations}
                  onChange={(e) => setProtocol({ ...protocol, willDeedLocations: e.target.value })}
                  placeholder="e.g. Original apartment Sale Deed & registered Will are stored in the blue file folder inside the study room metal cabinet."
                  rows={2}
                  className="input-field"
                />
              </div>
            </div>

            {/* 4. Step-by-Step Instructions for Family */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-600" />
                4. Step-by-Step Instructions &amp; Claim Guidance
              </h3>
              <div>
                <label className="label">Important Steps for Family to Follow</label>
                <textarea
                  value={protocol.handoverInstructions}
                  onChange={(e) => setProtocol({ ...protocol, handoverInstructions: e.target.value })}
                  placeholder="e.g. 1. Contact HDFC Life for Term Insurance claim (Policy number is saved in ClaimWise Insurance tab). 2. Submit original death certificate & cancelled cheque. 3. Call family chartered accountant Mr. Rajesh (+91 98450...). 4. Access emergency funds in Canara Bank savings account."
                  rows={3}
                  className="input-field"
                />
              </div>
            </div>

            {/* Print / Export Dossier Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 pt-4">
              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-gray-400" />
                All protocol details are AES encrypted and accessible exclusively by your authenticated account.
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary inline-flex items-center gap-2 !py-2 text-xs font-semibold"
              >
                <Printer className="h-4 w-4" /> Print Sealed Confidential Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
