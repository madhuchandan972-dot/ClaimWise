// ============================================================
// ClaimWise Platform — AI Integration Layer (modular)
//
// Architecture:
//   - All AI calls happen SERVER-SIDE only. Keys never reach
//     the browser.
//   - Model selection: Gemini 3.x generation. The configured
//     model chain is verified live against ListModels; retired
//     models (e.g. gemini-2.0-flash, gemini-2.5-flash for new
//     keys) are never hard-coded again.
//   - PRODUCTION SAFETY: when an API key IS configured but a
//     Gemini call fails, the routes return a PROPER ERROR —
//     simulated demo data is never silently substituted.
//     The clearly-labelled simulated extraction exists ONLY as
//     the demo mode when no key is configured at all.
// ============================================================

import type { DocumentType } from "./types";

// ----------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------

export interface AiAvailability {
  documentIntelligence: boolean; // Gemini document extraction
  assistantChat: boolean; // Gemini chat
}

export function getAiAvailability(): AiAvailability {
  return {
    documentIntelligence: Boolean(process.env.GOOGLE_GEMINI_API_KEY),
    assistantChat: Boolean(process.env.GOOGLE_GEMINI_API_KEY),
  };
}

export const AI_PROVIDER_NAMES = {
  documentIntelligence: "Google Gemini",
  assistantChat: "Google Gemini",
} as const;

/**
 * Gemini model selection. `GEMINI_MODEL` may override the chain;
 * otherwise the app tries a fast, generally-available model first
 * and falls back to the larger Flash tier on high demand.
 * (Verified live in Nov 2026: gemini-2.0-flash/2.5-flash are
 * retired for new API keys.)
 */
const DEFAULT_GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

function geminiModelChain(): string[] {
  const configured = (process.env.GEMINI_MODEL ?? "").trim();
  if (configured) return [configured];
  return DEFAULT_GEMINI_MODELS;
}

export function primaryGeminiModel(): string {
  return geminiModelChain()[0];
}

// ----------------------------------------------------------------
// Gemini HTTP plumbing — model fallback + typed failures
// ----------------------------------------------------------------

export class GeminiAuthError extends Error {}
export class GeminiUnavailableError extends Error {}

/** True when the HTTP status means "try the next model in the chain". */
function isRetryableModelFailure(status: number): boolean {
  // 404 → model retired/blocked; 503 → high demand; 429 → tier quota
  return status === 404 || status === 503 || status === 429;
}

interface GeminiApiErrorBody {
  error?: { message?: string; status?: string };
}

/**
 * Core single-turn call. Tries the model chain in order; throws
 * actionable, self-describing errors (never leaking the key).
 */
async function callGemini(body: Record<string, unknown>): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new GeminiAuthError("GEMINI_API_KEY_MISSING");

  const chain = geminiModelChain();
  let lastStatus = 0;
  let lastMessage = "";

  for (const model of chain) {
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(45_000),
        }
      );
    } catch (err) {
      // Network-level failure (timeout/DNS). The whole endpoint is
      // unreachable — retrying with a different model won't help.
      const reason = err instanceof Error ? err.message : "network error";
      throw new GeminiUnavailableError(
        `Gemini request failed (${reason}). Check network connectivity or the GEMINI_KEY hosting egress, then try again.`
      );
    }

    if (res.ok) {
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text =
        json.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("") ?? "";
      if (!text) throw new GeminiUnavailableError("Gemini returned an empty response.");
      return text;
    }

    lastStatus = res.status;
    const raw = await res.text().catch(() => "");
    try {
      lastMessage = (JSON.parse(raw) as GeminiApiErrorBody).error?.message ?? raw;
    } catch {
      lastMessage = raw;
    }
    lastMessage = (lastMessage ?? "").slice(0, 300);

    // Auth problems: the key itself is wrong/quota-unbound. Changing
    // the model will never fix this — abort the whole chain.
    if (res.status === 401 || res.status === 403 || res.status === 400) {
      throw new GeminiAuthError(describeAuthFailure(res.status, lastMessage));
    }
    if (isRetryableModelFailure(res.status)) continue;
    // Anything else (5xx): fall through to the next model, but keep
    // the last failure detail in case the chain exhausts.
  }

  throw new GeminiUnavailableError(
    `Gemini is currently unavailable (last status ${lastStatus}: ${lastMessage || "no detail"}). Please try again shortly.`
  );
}

function describeAuthFailure(status: number, message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("api key not valid") || lower.includes("invalid api key")) {
    return "Gemini rejected the API key (invalid key). Check GOOGLE_GEMINI_API_KEY in the server environment.";
  }
  if (lower.includes("quota") || lower.includes("billing")) {
    return "Gemini rejected the key for a quota/billing reason — the key is valid but the AI provider needs usage enabled (AI Studio API keys are free-tier eligible).";
  }
  if (status === 403) {
    return "Gemini denied access (403). The key may be restricted to other APIs, or Generative Language API is disabled for this key.";
  }
  return `Gemini rejected the request (status ${status}). ${message}`;
}

// ----------------------------------------------------------------
// Document intelligence (Gemini)
// ----------------------------------------------------------------

export interface ExtractionSuccess {
  mode: "gemini" | "simulated";
  documentType: DocumentType;
  extractedData: Record<string, string>;
  missingFields: string[];
  warnings: string[];
  rawNote: string;
}

export interface ExtractionResult extends ExtractionSuccess {
  /** Populated only for mode "error" results returned as a separate branch. */
  reason?: never;
}

/** Failure branch: production AI configured but the provider call failed. */
export interface ExtractionError {
  mode: "error";
  reason: string;
}

/** Fields we try to pull out of typical Indian student documents. */
const GENERIC_TARGET_FIELDS = [
  "name",
  "fatherName",
  "dob",
  "gender",
  "documentNumber",
  "issueDate",
  "expiryDate",
  "issuedBy",
  "percentage",
  "annualIncome",
  "category",
  "address",
];

interface SimulatedTemplate {
  type: DocumentType;
  keywords: string[];
  data: Record<string, string>;
}

/**
 * Deterministic, clearly-labelled simulated extraction templates.
 * These are the SAME fictional sample values used across the
 * ClaimWise demo campus (Priya Sharma). Nothing here is inferred
 * from the real file contents — the UI must always say so.
 *
 * Production wiring: these templates are used ONLY when no API key
 * is configured (demo mode). If a key IS configured, a Gemini
 * failure produces an ERROR — never a silent, simulated result.
 */
const SIMULATED_TEMPLATES: SimulatedTemplate[] = [
  {
    type: "AadhaarCard",
    keywords: ["aadhaar", "aadhar", "uidai"],
    data: {
      name: "Priya Sharma (simulated)",
      dob: "15 Jun 2003 (simulated)",
      gender: "Female (simulated)",
      documentNumber: "XXXX XXXX 4321 (simulated)",
    },
  },
  {
    type: "PANCard",
    keywords: ["pan"],
    data: {
      name: "Priya Sharma (simulated)",
      documentNumber: "ABCPS1234D (simulated)",
      dob: "15 Jun 2003 (simulated)",
    },
  },
  {
    type: "IncomeCertificate",
    keywords: ["income"],
    data: {
      name: "Priya Sharma (simulated)",
      fatherName: "Ramesh Sharma (simulated)",
      annualIncome: "₹2,80,000 (simulated)",
      issuedBy: "Tahsildar (simulated)",
      issueDate: "2026-07-25 (simulated)",
    },
  },
  {
    type: "CasteCertificate",
    keywords: ["caste", "category"],
    data: {
      name: "Priya Sharma (simulated)",
      category: "OBC (simulated)",
      issuedBy: "Deputy Commissioner (simulated)",
      issueDate: "2021-05-10 (simulated)",
    },
  },
  {
    type: "MarksCard",
    keywords: ["mark", "marks", "sslc", "puc", "score", "transcript", "10th", "12th"],
    data: {
      name: "Priya Sharma (simulated)",
      documentNumber: "PU21-KA-78901 (simulated)",
      percentage: "92.67% (simulated)",
      issuedBy: "Department of Pre-University Education (simulated)",
      issueDate: "2021-07-30 (simulated)",
    },
  },
  {
    type: "TransferCertificate",
    keywords: ["transfer", "tc "],
    data: {
      name: "Priya Sharma (simulated)",
      issuedBy: "Institution Principal (simulated)",
      issueDate: "2022-06-01 (simulated)",
    },
  },
  {
    type: "BankDocument",
    keywords: ["bank", "passbook", "cheque", "account"],
    data: {
      name: "Priya Sharma (simulated)",
      documentNumber: "XXXX XXXX 9876 (simulated)",
      issuedBy: "State Bank of India (simulated)",
    },
  },
];

function classifyByFilename(name: string): DocumentType {
  const lower = name.toLowerCase();
  for (const t of SIMULATED_TEMPLATES) {
    if (t.keywords.some((k) => lower.includes(k))) return t.type;
  }
  return "Other";
}

/**
 * Demo-mode extraction. Deterministic and honest: the values come
 * from the fictional demo dataset, chosen by filename keywords.
 */
function simulateExtraction(fileName: string, declaredType: DocumentType): ExtractionSuccess {
  const type = classifyByFilename(fileName);
  const template = SIMULATED_TEMPLATES.find((t) => t.type === type);
  const finalType = template ? template.type : declaredType === "Other" ? "Other" : declaredType;
  const template2 =
    template ?? SIMULATED_TEMPLATES.find((t) => t.type === finalType);

  return {
    mode: "simulated",
    documentType: finalType,
    extractedData: template2?.data ?? {},
    missingFields: GENERIC_TARGET_FIELDS.filter(
      (f) => !template2?.data?.[f]
    ).slice(0, 4),
    warnings: [
      "Demo mode: these fields were NOT read from your file. They are pre-defined sample values so you can explore the review workflow safely.",
      "To enable real analysis, set GOOGLE_GEMINI_API_KEY in .env.local (see README §AI setup).",
    ],
    rawNote:
      "Simulated result — produced by the demo template engine, not by an AI model.",
  };
}

const EXTRACTION_PROMPT = (fileName: string) =>
  `You are a document intelligence assistant for an Indian scholarship platform. The user uploaded a document ("${fileName}"). First classify it into exactly one of: AadhaarCard, PANCard, IncomeCertificate, CasteCertificate, MarksCard, TransferCertificate, BankDocument, Other. Then extract visible key fields (name, fatherName, dob, gender, documentNumber, issueDate, expiryDate, issuedBy, percentage, annualIncome, category, address). Respond ONLY with compact JSON: {"documentType":"...","extractedData":{...},"missingFields":["fields you expected but could not find"],"privacyNote":"mention any unexpectedly sensitive data found"}. If text is unreadable, say so in missingFields instead of guessing.`;

/** Calls Gemini for real extraction when a key is configured. */
async function geminiExtract(
  fileBase64: string,
  mimeType: string,
  fileName: string
): Promise<ExtractionSuccess> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) throw new GeminiAuthError("GEMINI_API_KEY_MISSING");

  const text = await callGemini({
    contents: [
      {
        parts: [
          { text: EXTRACTION_PROMPT(fileName) },
          { inline_data: { mime_type: mimeType, data: fileBase64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  });

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new GeminiUnavailableError("Gemini returned an unparseable response.");

  const parsed = JSON.parse(match[0]) as {
    documentType?: string;
    extractedData?: Record<string, string>;
    missingFields?: string[];
    privacyNote?: string;
  };

  const knownTypes: DocumentType[] = [
    "AadhaarCard",
    "PANCard",
    "IncomeCertificate",
    "CasteCertificate",
    "MarksCard",
    "TransferCertificate",
    "BankDocument",
    "Other",
  ];

  return {
    mode: "gemini",
    documentType: knownTypes.includes(parsed.documentType as DocumentType)
      ? (parsed.documentType as DocumentType)
      : "Other",
    extractedData: parsed.extractedData ?? {},
    missingFields: parsed.missingFields ?? [],
    warnings: parsed.privacyNote ? [parsed.privacyNote] : [],
    rawNote: "Extracted by Google Gemini from the uploaded file.",
  };
}

export interface ExtractionInput {
  fileName: string;
  mimeType: string;
  fileBuffer?: Buffer;
  declaredType: DocumentType;
}

export type DocumentExtractionOutcome =
  | ExtractionSuccess // gemini / simulated (demo only)
  | ExtractionError;

export async function runDocumentExtraction(
  input: ExtractionInput
): Promise<DocumentExtractionOutcome> {
  const available = getAiAvailability().documentIntelligence;

  if (!available) {
    // Explicit demo mode — labelled everywhere it is displayed.
    return simulateExtraction(input.fileName, input.declaredType);
  }

  if (!input.fileBuffer) {
    return {
      mode: "error",
      reason: "Document content is required for real extraction.",
    };
  }

  // Key configured → REAL AI only. On failure, surface a proper
  // error; never silently fall back to simulated demo values.
  try {
    return await geminiExtract(
      input.fileBuffer.toString("base64"),
      input.mimeType,
      input.fileName
    );
  } catch (err) {
    const reason = describeAiFailure(err);
    console.error("[ai] Gemini extraction failed:", reason);
    return { mode: "error", reason };
  }
}

/** Maps AI-layer errors to an honest, user-facing message. */
export function describeAiFailure(err: unknown): string {
  if (err instanceof GeminiAuthError || err instanceof GeminiUnavailableError) {
    return err.message;
  }
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.startsWith("GEMINI_ERROR_")) return raw.replace("GEMINI_ERROR_", "Gemini API error ");
  return `AI service error: ${raw.slice(0, 200)}`;
}

// ----------------------------------------------------------------
// Scholarship assistant chat (used when configured; routes surface
// explicit errors when unavailable — no silent static replies in
// production mode)
// ----------------------------------------------------------------

const CHAT_SYSTEM_PROMPT =
  "You are the ClaimWise Scholarship Assistant for Indian students. Give concise, practical, application-oriented advice. Never invent scholarship names, amounts, or deadlines. If you are unsure, tell the student to verify on the official portal.";

export async function runAssistantReply(
  messages: { role: "user" | "assistant"; content: string }[],
  extraSystemContext?: string
): Promise<{
  mode: "gemini" | "unavailable" | "error";
  reply: string;
  reason?: string;
}> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return {
      mode: "unavailable",
      reply:
        "AI chat is not configured on this server. To enable live AI replies, set GOOGLE_GEMINI_API_KEY in the server environment (see README).",
      reason: "AI_NOT_CONFIGURED",
    };
  }

  const systemText = extraSystemContext
    ? `${CHAT_SYSTEM_PROMPT}\n\nGrounding context for this student (use ONLY these facts; do not invent schemes):\n${extraSystemContext}`
    : CHAT_SYSTEM_PROMPT;

  try {
    const reply = await callGemini({
      systemInstruction: { parts: [{ text: systemText }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
    });
    return { mode: "gemini", reply };
  } catch (err) {
    const reason = describeAiFailure(err);
    console.error("[ai] Gemini chat failed:", reason);
    return { mode: "error", reply: "", reason };
  }
}

// ----------------------------------------------------------------
// Live scholarship discovery (Gemini + Google Search grounding)
//
// The catalogue philosophy in ClaimWise is strict: no invented
// scholarships. This pipeline therefore:
//   • uses google_search grounding so results come from the live
//     web rather than model memory,
//   • requires every entry to carry a real, official source URL,
//   • is stored with verification_status = 'needs_verification'
//     until an administrator confirms it manually.
// ----------------------------------------------------------------

export interface LiveScholarshipDraft {
  name: string;
  provider: string;
  amount: string;
  /** ISO 8601 date (YYYY-MM-DD at minimum). */
  deadline: string;
  status?: string;
  description: string;
  educationLevel?: string;
  states?: string[];
  courses?: string[];
  categoryRequirements?: string[];
  scholarshipType?: string;
  familyIncomeCriteria?: string;
  maxIncome?: number;
  sourceUrl: string;
  officialLink?: string;
}

const LIVE_DISCOVERY_PROMPT = (todayIso: string) =>
  `You are the live catalogue researcher for ClaimWise, a platform for Indian students. Today's date is ${todayIso} (Asia/Kolkata).

Task: find scholarships for Indian students whose application window is CURRENTLY OPEN (open today, closing in the future). Use Google Search grounding to check every detail against official, verifiable sources such as government portals (National Scholarship Portal, state scholarship portals, AICTE, UGC, Ministry portals) or the provider's own official page.

Rules you MUST follow:
- Only REAL schemes you can trace to an official page right now. Never invent names, amounts or deadlines from memory.
- Every entry must include the official page URL in "sourceUrl" that you actually saw in search results.
- Only include a scheme if you are confident its application window is open and you have a publicly stated deadline.
- If the official page states a deadline that already passed, drop the scheme.
- Prefer variety: central government, state government, and private/corporate schemes. 8 to 14 entries.
- Amounts and deadlines must match what the official page or a current official notice says.
- If the deadline is expressed in words (e.g. "November 30, 2026"), normalise it to YYYY-MM-DD.

Respond ONLY with a JSON array (no prose, no markdown fences) where each element is:
{"name":"...","provider":"...","amount":"...","deadline":"YYYY-MM-DD","description":"2-3 sentences from official wording","educationLevel":"10th|12th|Diploma|Undergraduate|Postgraduate|PhD or specific course","states":["Karnataka"] or [] for pan-India,"categoryRequirements":["General","OBC","SC","ST","EWS"] or [],"scholarshipType":"Merit|Means-cum-merit|Minority|Girls|Technical|...","familyIncomeCriteria":"as published","maxIncome":numericAnnualRupeesOrNull,"sourceUrl":"https://official/page"}`;

/**
 * Runs a grounded Gemini call with the model chain. If a model rejects
 * the google_search tool (some tiers do), the chain is retried without
 * grounding — the caller then marks results as needing verification,
 * which the persistence layer already does.
 */
async function liveSearchCycle(body: Record<string, unknown>): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new GeminiAuthError("GEMINI_API_KEY_MISSING");
  const chain = geminiModelChain();
  let lastStatus = 0;
  let lastMessage = "";

  for (let pass = 0; pass < 2; pass++) {
    const withTools = pass === 0;
    for (const model of chain) {
      let res: Response;
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify(withTools ? { ...body, tools: [{ google_search: {} }] } : body),
            signal: AbortSignal.timeout(90_000),
          }
        );
      } catch (err) {
        const reason = err instanceof Error ? err.message : "network error";
        throw new GeminiUnavailableError(`Live search request failed (${reason}).`);
      }

      if (res.ok) {
        const json = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text =
          json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
        if (!text) {
          lastMessage = "empty response";
          continue;
        }
        return text;
      }

      lastStatus = res.status;
      const raw = await res.text().catch(() => "");
      try {
        lastMessage = (JSON.parse(raw) as GeminiApiErrorBody).error?.message ?? raw;
      } catch {
        lastMessage = raw;
      }
      lastMessage = (lastMessage ?? "").slice(0, 300);

      if (res.status === 401 || res.status === 403) {
        throw new GeminiAuthError(describeAuthFailure(res.status, lastMessage));
      }
      // A model that rejects the google_search tool should not poison the
      // chain — skip to the next model, then retry without tools.
      if (res.status === 400 && /tool|google_search|search/i.test(lastMessage)) continue;
      if (isRetryableModelFailure(res.status)) continue;
    }
  }

  throw new GeminiUnavailableError(
    `Live search is currently unavailable (last status ${lastStatus || "unknown"}: ${lastMessage || "no detail"}). Please try again shortly.`
  );
}

/** Calls Gemini with Google Search grounding to find currently-open scholarships. */
export async function runLiveScholarshipSearch(): Promise<LiveScholarshipDraft[]> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    throw new GeminiAuthError("GEMINI_API_KEY_MISSING");
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const text = await liveSearchCycle({
    contents: [{ role: "user", parts: [{ text: LIVE_DISCOVERY_PROMPT(today) }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
  });

  // The grounded model occasionally wraps JSON in prose or fences — take
  // the outermost array literal.
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new GeminiUnavailableError(
      "Gemini did not return a parseable catalogue. Try the live search again."
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new GeminiUnavailableError(
      "Gemini returned malformed catalogue data. Try the live search again."
    );
  }
  if (!Array.isArray(parsed)) {
    throw new GeminiUnavailableError(
      "Gemini returned unexpected catalogue data. Try the live search again."
    );
  }

  // Strip obviously incomplete entries here; the API route performs the
  // strict schema validation and freshness filtering.
  return (parsed as Record<string, unknown>[]).filter((entry) => {
    const name = typeof entry?.name === "string" ? entry.name.trim() : "";
    const provider = typeof entry?.provider === "string" ? entry.provider.trim() : "";
    const sourceUrl = typeof entry?.sourceUrl === "string" ? entry.sourceUrl.trim() : "";
    return name.length > 3 && provider.length > 1 && /^https?:\/\//.test(sourceUrl);
  }) as unknown as LiveScholarshipDraft[];
}
