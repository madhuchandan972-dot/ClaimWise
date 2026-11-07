'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Is ClaimWise free to use?',
    a: 'Yes, ClaimWise is completely free for all students. There are no hidden charges, subscription fees, or commissions. Our mission is to make scholarship access equitable for every Indian student.',
  },
  {
    q: 'Which scholarships does ClaimWise cover?',
    a: 'We cover central government scholarships (National Scholarship Portal, AICTE, UGC), state government schemes across all 28 states and 8 UTs, and select institutional scholarships. Our database is updated regularly to include new and revised schemes.',
  },
  {
    q: 'Is my personal data and documents safe?',
    a: 'Absolutely. We use industry-standard AES-256 encryption for all stored documents and TLS 1.3 for data in transit. Your documents are stored on secure servers in India and are never shared with third parties without your explicit consent.',
  },
  {
    q: 'Can ClaimWise apply for scholarships on my behalf?',
    a: 'ClaimWise assists you at every step of the application — filling forms, checking documents, flagging errors — but you always review and submit the final application yourself. This ensures accuracy and keeps you in control of your applications.',
  },
  {
    q: 'Which documents do I need to upload?',
    a: 'The most commonly required documents are: Aadhaar card, income certificate, marks cards / academic transcripts, caste certificate (if applicable), bank passbook, domicile certificate, and passport-size photographs. ClaimWise will tell you exactly which documents each scholarship requires.',
  },
  {
    q: 'Does ClaimWise work for all states in India?',
    a: 'Yes, ClaimWise covers scholarships across all Indian states and Union Territories. We include both central government schemes available nationally and state-specific schemes for each state. Our filters let you narrow by your home state and current state of study.',
  },
  {
    q: 'How accurate is the eligibility check?',
    a: 'Eligibility matching is based on official scholarship criteria published by government portals. Our AI cross-references your profile against these criteria with high accuracy. However, we always recommend verifying with the official scholarship portal before submitting, as criteria may change.',
  },
  {
    q: 'What happens after I apply for a scholarship?',
    a: 'ClaimWise tracks your application status in real time (where data is available from the scholarship portal). You receive notifications for status changes — submission confirmed, under review, approved, or disbursed. We also remind you of deadlines for follow-up actions.',
  },
];

function FAQItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-start gap-4">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-sm font-semibold text-gray-900 sm:text-base">
            {faq.q}
          </span>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="pb-5 pl-10 text-sm leading-relaxed text-gray-600">{faq.a}</p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  return (
    <section id="faq" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
            Got Questions?
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
            Everything you need to know about ClaimWise. Can&apos;t find your answer?{' '}
            <a href="mailto:support@claimwise.in" className="font-semibold text-blue-600 hover:underline">
              Email us.
            </a>
          </p>
        </div>

        {/* Accordion */}
        <div className="rounded-2xl border border-gray-100 bg-white px-6 shadow-sm sm:px-8">
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} faq={faq} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
