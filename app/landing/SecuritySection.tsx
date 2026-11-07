import Link from 'next/link';
import { ShieldCheck, KeyRound, EyeOff, Server } from 'lucide-react';

const principles = [
  {
    icon: EyeOff,
    title: 'Private by default',
    text: 'Your documents live in your personal vault. They are never shared, published, or exposed through public links — access is tied to your account and checked on the server for every request.',
  },
  {
    icon: KeyRound,
    title: 'Approved-data only',
    text: 'AI extraction results stay in review until you approve them. Approved profile data is the only information used to prepare applications.',
  },
  {
    icon: Server,
    title: 'Secrets stay on the server',
    text: 'API keys for AI services live only in server-side environment variables — never in the browser, never in page code.',
  },
];

export default function SecuritySection() {
  return (
    <section id="security" className="relative overflow-hidden bg-gradient-to-b from-blue-900 to-blue-950 py-20 sm:py-24">
      {/* Decorative rings */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full border border-white/10" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-5">
          {/* Badge stack */}
          <div className="lg:col-span-2">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-400/20">
                  <ShieldCheck className="h-6 w-6 text-green-300" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">Your Own Vault</p>
                  <p className="text-xs text-blue-200">Only you can open your documents</p>
                </div>
              </div>
              <div className="mt-4 ml-8 flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-400/20">
                  <EyeOff className="h-6 w-6 text-blue-200" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">No Public Links</p>
                  <p className="text-xs text-blue-200">Files never get shareable URLs</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-400/20">
                  <KeyRound className="h-6 w-6 text-purple-200" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">You Confirm Everything</p>
                  <p className="text-xs text-blue-200">Submissions happen only with your approval</p>
                </div>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="lg:col-span-3">
            <span className="mb-3 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-blue-100">
              Document Security
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Sensitive documents deserve serious caution
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-blue-100">
              Aadhaar cards, income certificates, bank details — ClaimWise handles
              documents like these with a security-first architecture, and we are
              relentlessly honest about what is and isn&apos;t protected yet.
            </p>

            <ul className="mt-8 space-y-5">
              {principles.map((p) => (
                <li key={p.title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <p.icon className="h-5 w-5 text-blue-200" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-blue-100/90">{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-amber-300/30 bg-amber-400/10 px-5 py-4">
              <p className="text-sm leading-relaxed text-amber-100">
                <b>Honest note:</b> this is a development-stage product. We follow
                security best practices and architecture, but no system should be
                trusted as &quot;fully secure&quot; without an independent security audit.
                We recommend using dummy documents while testing the demo.
              </p>
            </div>

            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-800 shadow-sm transition-all hover:bg-blue-50"
            >
              Explore the Demo Vault <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
