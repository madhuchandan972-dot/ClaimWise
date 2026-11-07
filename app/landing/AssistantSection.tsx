'use client';

import Link from 'next/link';
import { Sparkles, Bot, FileCheck2, ListChecks } from 'lucide-react';

const capabilities = [
  {
    icon: ListChecks,
    title: 'Transparent eligibility reports',
    text: 'Every match comes with the exact reasons you qualify — and the exact reasons you don\'t. No unexplained percentages.',
  },
  {
    icon: FileCheck2,
    title: 'Application preparation',
    text: 'ClaimWise prepares your application fields from your approved profile data. You review every value before anything is sent.',
  },
  {
    icon: Bot,
    title: 'Guided portal filling',
    text: 'A step-by-step helper walks you through supported application portals while you stay in full control of logins, OTPs and submission.',
  },
];

export default function AssistantSection() {
  return (
    <section id="assistant" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left copy */}
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600">
              <Sparkles className="h-4 w-4" /> AI Scholarship Assistant
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              An assistant that prepares.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                A student that decides.
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-600">
              ClaimWise&apos;s AI helps you prepare, review and track scholarship
              applications — but you always stay in the driver&apos;s seat. Logins,
              one-time passwords and the final submit button remain yours, always.
            </p>

            <ul className="mt-8 space-y-6">
              {capabilities.map((c) => (
                <li key={c.title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                    <c.icon className="h-5 w-5 text-indigo-600" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{c.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
            >
              Try the Assistant <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Right — assistant chat mockup */}
          <div className="relative">
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
                  <Bot className="h-5 w-5 text-white" />
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900">ClaimWise Assistant</p>
                  <p className="text-xs text-gray-500">Application help · Pragati Scholarship</p>
                </div>
                <span className="ml-auto rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">
                  REVIEW MODE
                </span>
              </div>

              <div className="space-y-3">
                <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm text-white">
                  Can you prepare my Pragati application?
                </div>
                <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700 shadow-sm">
                  Done. From your profile I prepared <b>12 fields</b> — name, course,
                  AICTE institution details, family income (₹2,80,000) and more.
                  <span className="mt-2 block text-xs text-gray-500">
                    Nothing is submitted until you review each field and confirm.
                  </span>
                </div>
                <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  ⚠️ One document is missing: <b>Bank passbook</b>. Upload it in your Vault before the portal step.
                </div>
                <div className="flex gap-2 pt-1">
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                    Review my fields
                  </span>
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                    Open mock portal
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-gray-400">
              Illustration of the assistant interface · final submissions always happen on official portals
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
