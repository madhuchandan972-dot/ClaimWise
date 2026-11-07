// ============================================================
// ClaimWise — Scholarship Assistant chat (live AI, Gemini)
//
// Real AI behaviour:
//   - When GOOGLE_GEMINI_API_KEY is configured server-side, this
//     is a genuine chat: replies come from Gemini via
//     /api/assistant/chat, grounded in the student's own
//     catalogue and applications (never invented schemes).
//   - When AI is not configured, the component states this
//     honestly instead of pretending to chat.
//   - Provider failures (overload, auth, rate limit) surface as
//     explicit errors — never as a fake reply.
// ============================================================

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageCircleQuestion, SendHorizonal, Loader2, Sparkles, TriangleAlert, Info } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  mode?: 'gemini';
  error?: boolean;
}

const SUGGESTIONS = [
  'Which of my tracked applications has the nearest deadline?',
  'What profile facts should I complete first to unlock more schemes?',
  'How do I get an income certificate in my state?',
];

export default function AssistantChat() {
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/api/integrations/status')
      .then((r) => r.json())
      .then((d) => setAiAvailable(Boolean(d?.success && d.ai?.assistantChat)))
      .catch(() => setAiAvailable(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Greeting shown below the first send (kept after availability check)
  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    setInput('');
    const history = messages.filter((m) => !m.error).map(({ role, content: c }) => ({ role, content: c }));
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setSending(true);
    try {
      const r = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', content }] }),
      });
      const d = await r.json();
      if (d.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: d.reply as string, mode: 'gemini' }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: d.error ?? 'The AI service could not be reached. Please try again shortly.', error: true },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error reaching the AI service. Please try again shortly.', error: true },
      ]);
    } finally {
      setSending(false);
    }
  }, [messages, sending]);

  if (aiAvailable === null) {
    return (
      <section className="flex h-24 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </section>
    );
  }

  if (aiAvailable === false) {
    // Honest unconfigured state — no pretending to chat.
    return (
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <MessageCircleQuestion className="h-4 w-4 text-gray-400" /> Scholarship Assistant chat
        </h2>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p className="text-[11px] leading-relaxed text-blue-700">
            <b>Live AI chat is not configured on this server.</b> Structured guidance below (via the
            Application Assistant and Eligibility Check) works fully without it. To enable live AI
            replies, the host sets <code className="font-mono text-[10px]">GOOGLE_GEMINI_API_KEY</code> in
            the server environment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <MessageCircleQuestion className="h-4 w-4 text-blue-600" /> Scholarship Assistant chat
        </h2>
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
          <Sparkles className="h-3 w-3" /> Live AI · Google Gemini
        </span>
      </div>

      <p className="mb-3 text-xs text-gray-500">
        Ask about funding options or how to arrange documents. Answers are grounded in the schemes
        loaded in your Scholarship Hub — the assistant is instructed never to invent schemes,
        amounts or deadlines. Verify anything important on the official portal.
      </p>

      <div
        ref={scrollRef}
        className="scrollbar-thin mb-3 max-h-80 space-y-3 overflow-y-auto rounded-xl bg-gray-50 px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">
              Start with one of these, or type your own question:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={sending}
                  className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-left text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                m.error
                  ? 'flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800'
                  : m.role === 'user'
                    ? 'rounded-br-sm bg-blue-600 text-white'
                    : 'rounded-bl-sm border border-gray-200 bg-white text-gray-700'
              }`}
            >
              {m.error && <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-2.5 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Gemini is thinking…
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={aiAvailable ? 'Ask a scholarship or documents question…' : 'AI chat is not configured on this server'}
          disabled={!aiAvailable || sending}
          maxLength={2000}
          className="input-field flex-1 !py-2.5 text-xs"
          aria-label="Message the scholarship assistant"
        />
        <button
          type="submit"
          disabled={!aiAvailable || sending || !input.trim()}
          className="btn-primary !px-4 !py-2.5 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          aria-label="Send message"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
        </button>
      </form>
    </section>
  );
}
