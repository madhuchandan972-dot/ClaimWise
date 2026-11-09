'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  Car,
  HeartPulse,
  FileCheck2,
} from 'lucide-react';
import type { InsuranceRecord } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  {
    icon: HeartPulse,
    label: 'Planned Surgery (Cashless)',
    query: 'My mother is scheduled for a planned surgery in a network hospital. What is the step-by-step cashless pre-authorization process and what documents are required?',
  },
  {
    icon: AlertCircle,
    label: 'Emergency Admission',
    query: 'A family member was admitted to the hospital in an emergency. What must I do in the first 24 hours to ensure the health insurance claim does not get rejected?',
  },
  {
    icon: Car,
    label: 'Vehicle Accident / NCB',
    query: 'My car was involved in a minor collision. How do I decide whether to claim insurance or protect my No-Claim Bonus (NCB), and what proofs should I collect before moving the vehicle?',
  },
  {
    icon: FileCheck2,
    label: 'Cataract / Daycare Procedure',
    query: 'Is a daycare procedure like cataract surgery or dialysis covered without 24 hours of hospitalization? How does the sub-limit apply under IRDAI norms?',
  },
];

export default function ClaimAdvisorPage() {
  const [policies, setPolicies] = useState<InsuranceRecord[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('all');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '👋 **Hello! I am your ClaimWise AI Claim Advisor.**\n\nWondering whether a medical procedure, surgery, car accident, or hospitalization is covered? Tell me what happened, or select a policy above to get a tailored coverage breakdown, paperwork checklist, and claim tips under IRDAI guidelines.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/insurance')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.records) {
          setPolicies(data.records);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(textToSend?: string) {
    const q = (textToSend || input).trim();
    if (!q || loading) return;

    const newMsgs: Message[] = [...messages, { role: 'user', content: q }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/insurance/claim-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs,
          policyId: selectedPolicyId !== 'all' ? selectedPolicyId : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages([...newMsgs, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([
          ...newMsgs,
          {
            role: 'assistant',
            content: `⚠️ ${data.error || 'Could not analyze claim scenario. Please try again.'}`,
          },
        ]);
      }
    } catch {
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          content: '⚠️ Network connection error. Please check your internet and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleReset() {
    setMessages([
      {
        role: 'assistant',
        content:
          'Conversation reset. Ask any question about insurance coverage, claims, pre-authorization, or document requirements!',
      },
    ]);
  }

  const activePolicy = policies.find((p) => p.id === selectedPolicyId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/insurance"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Insurance Policies
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                AI Claim Advisor
              </h1>
              <p className="text-xs text-gray-500">
                Instant claim feasibility, IRDAI rules, document checklists & rejection avoidance
              </p>
            </div>
          </div>
        </div>

        {/* Policy Selector & Reset */}
        <div className="flex items-center gap-2">
          <div className="min-w-[200px]">
            <select
              value={selectedPolicyId}
              onChange={(e) => setSelectedPolicyId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">🔍 All Registered Policies</option>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.provider} ({p.policyType}) {p.policyNumber ? `#${p.policyNumber}` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleReset}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 shadow-sm transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Selected Policy Banner (if one is chosen) */}
      {activePolicy && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              Analyzing with respect to <strong>{activePolicy.provider}</strong> ({activePolicy.policyType} Insurance)
              {activePolicy.policyNumber ? ` · Policy #${activePolicy.policyNumber}` : ''}
              {activePolicy.policyholderName ? ` · Policyholder: ${activePolicy.policyholderName}` : ''}
            </span>
          </div>
          {activePolicy.expiryDate && (
            <span className="text-[11px] text-gray-500 shrink-0 ml-2">
              Valid till: {new Date(activePolicy.expiryDate).toLocaleDateString('en-IN')}
            </span>
          )}
        </div>
      )}

      {/* Quick Questions Starter Chips */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
          Popular Claim Questions:
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_PROMPTS.map((prompt, i) => {
            const Icon = prompt.icon;
            return (
              <button
                key={i}
                onClick={() => handleSend(prompt.query)}
                disabled={loading}
                className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm hover:border-blue-200 hover:bg-blue-50/50 hover:shadow transition-all group disabled:opacity-50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-blue-900 line-clamp-2">
                  {prompt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={`relative max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {m.content}
                  </div>

                  {!isUser && (
                    <button
                      onClick={() => handleCopy(m.content, idx)}
                      className="absolute top-3 right-3 rounded-lg p-1 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 transition-colors"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white animate-pulse">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="rounded-2xl rounded-bl-none border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Analyzing insurance policy terms and IRDAI claim rules…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-gray-100 p-3 sm:p-4 bg-gray-50/50 rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Can I claim cashless for gallbladder stone surgery at Manipal Hospital?"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
          <p className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
            <HelpCircle className="h-3 w-3 shrink-0" />
            Advice is generated according to standard IRDAI claim protocols. Always confirm specific sub-limits with your insurer/TPA desk.
          </p>
        </div>
      </div>
    </div>
  );
}
