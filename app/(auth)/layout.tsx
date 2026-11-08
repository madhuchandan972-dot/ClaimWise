import Image from 'next/image'
import { CheckCircle, ShieldCheck } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 p-12 lg:flex lg:w-1/2 xl:w-5/12">
        <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-500/20" />
        <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/2 translate-y-1/2 rounded-full bg-purple-500/15" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg">
              <Image
                src="/claimwise-logo.png"
                alt="ClaimWise logo"
                width={788}
                height={695}
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">ClaimWise</span>
              <p className="text-[11px] font-medium uppercase tracking-wider text-blue-300">Family Vault</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-3xl font-bold leading-snug text-white">
              Your family&apos;s important information, protected in one place.
            </p>
            <p className="mt-4 text-sm font-medium text-blue-200">
              Documents, property, insurance, financial obligations and emergency contacts — private by default.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              'Private vault for every account',
              'Supabase Auth with server-verified sessions',
              'Row Level Security on every record',
              'Trusted family access you control',
            ].map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                <span className="text-sm leading-relaxed text-blue-100">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-2 border-t border-white/20 pt-6 text-xs text-blue-200">
          <ShieldCheck className="h-4 w-4 text-green-400" />
          Sessions use HttpOnly cookies — never browser localStorage.
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-gray-50 px-6 py-12">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
            <Image
              src="/claimwise-logo.png"
              alt="ClaimWise logo"
              width={788}
              height={695}
              className="h-7 w-auto object-contain"
            />
          </div>
          <span className="text-lg font-bold text-blue-900">ClaimWise</span>
        </div>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
