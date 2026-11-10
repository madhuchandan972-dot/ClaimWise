'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Is ClaimWise free to use?',
    a: 'Yes, ClaimWise is completely free for all students. There are no hidden fees, premium tiers or credit card requirements. Our mission is to make scholarship access equal for every Indian student.',
  },
  {
    q: 'Which scholarships does ClaimWise cover?',
    a: 'We cover central government scholarships (National Scholarship Portal, AICTE, UGC), state government scholarships, and verified private scholarships across all Indian states. Our catalogue is continuously updated.',
  },
  {
    q: 'Is my personal data and documents safe?',
    a: 'We use industry-standard security: Supabase Auth with HttpOnly session cookies, Row Level Security on every database table, and private storage buckets for documents. Your files are only accessible to you. We never sell your data.',
  },
  {
    q: 'Can ClaimWise apply for scholarships on my behalf?',
    a: 'No. ClaimWise assists you in preparing your application — filling in fields from your profile, checking required documents and reviewing everything. But you always review and submit the application yourself on the official portal. We never submit without your explicit approval.',
  },
  {
    q: 'Which documents do I need to upload?',
    a: 'The most useful documents are: Aadhaar Card, PAN Card, Income Certificate, Caste Certificate (if applicable), Marks Cards (all years), Transfer Certificate, and Bank Passbook. ClaimWise tells you exactly which documents each scholarship needs.',
  },
  {
    q: 'Does ClaimWise work for all states in India?',
    a: 'Yes. We cover scholarships across all 28 states and 8 Union Territories. The eligibility checker filters scholarships by your state automatically when your profile is set up.',
  },
  {
    q: 'How accurate is the eligibility check?',
    a: 'Eligibility matching is based on official scholarship criteria. ClaimWise gives transparent reasons for every result — eligible, possibly eligible, or not eligible. We always recommend verifying on the official scholarship portal before applying.',
  },
  {
    q: 'What happens after I apply for a scholarship?',
    a: 'ClaimWise tracks your application status in the Application Tracker. You can update the status yourself, and the system will remind you of verification dates, missing document requests and result announcements.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="scroll-mt-20 bg-slate-50 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                  isOpen ? 'border-blue-200' : 'border-gray-100'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="pr-4 text-sm font-semibold text-gray-900">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 px-6 py-4">
                    <p className="text-sm leading-relaxed text-gray-600">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
