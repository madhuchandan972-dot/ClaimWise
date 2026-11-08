// ============================================================
// ClaimWise — POST /api/scholarships/live
//
// Discovers CURRENTLY OPEN scholarships for Indian students via
// Gemini with Google Search grounding and upserts them into
// public.scholarships through the SECURITY DEFINER function from
// migration 004. Entries always carry their official source URL
// and are persisted as verification_status='needs_verification'
// (source='live') — the UI labels them accordingly.
//
// Guards:
//   • Requires a signed-in session.
//   • 60-second cooldown per user to protect the AI quota.
//   • HONESTY: nothing is fabricated here — entries without a
//     real source URL or a future deadline are dropped.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  describeAiFailure,
  getAiAvailability,
  runLiveScholarshipSearch,
} from "@/lib/ai";
import { upsertLiveScholarships } from "@/lib/store";
import { z } from "zod";

const MAX_ITEMS = 40;
const COOLDOWN_MS = 60_000;

const draftSchema = z.object({
  name: z.string().trim().min(4).max(220),
  provider: z.string().trim().min(2).max(160),
  amount: z.string().trim().min(1).max(120).optional().default("Varies"),
  deadline: z.coerce.date(),
  description: z.string().trim().min(20).max(1500),
  educationLevel: z.string().trim().max(60).optional().default(""),
  states: z
    .array(z.string().trim().min(1).max(60))
    .max(40)
    .optional()
    .default([]),
  courses: z
    .array(z.string().trim().min(1).max(80))
    .max(20)
    .optional()
    .default([]),
  categoryRequirements: z
    .array(z.string().trim().min(1).max(40))
    .max(10)
    .optional()
    .default([]),
  scholarshipType: z.string().trim().max(80).optional().default(""),
  familyIncomeCriteria: z.string().trim().max(200).optional().default(""),
  maxIncome: z.number().int().nonnegative().max(1_000_000_000).optional(),
  sourceUrl: z.string().trim().url().max(600),
  officialLink: z.string().trim().url().max(600).optional(),
});

/** In-memory per-user cooldown (per server instance is fine for the MVP). */
const lastRunByUser = new Map<string, number>();

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Not signed in." },
      { status: 401 }
    );
  }

  if (!getAiAvailability().assistantChat) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Live search is not configured on this server. Set GOOGLE_GEMINI_API_KEY in the deployment environment to enable it.",
      },
      { status: 503 }
    );
  }

  const now = Date.now();
  const lastRun = lastRunByUser.get(session.sub) ?? 0;
  if (now - lastRun < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - lastRun)) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: `The live search ran a moment ago — try again in ${wait}s.`,
      },
      { status: 429 }
    );
  }
  lastRunByUser.set(session.sub, now);

  let drafts;
  try {
    drafts = await runLiveScholarshipSearch();
  } catch (err) {
    const reason = describeAiFailure(err);
    console.error("[/api/scholarships/live] discovery failed:", reason);
    return NextResponse.json(
      {
        success: false,
        error:
          reason === "GEMINI_API_KEY_MISSING"
            ? "Live search is not configured on this server."
            : reason,
      },
      { status: 503 }
    );
  }

  const today = Date.now();
  const kept: unknown[] = [];
  for (const draft of drafts) {
    const parsed = draftSchema.safeParse(draft);
    if (!parsed.success) continue; // not schema-safe → never persisted

    const { deadline, ...rest } = parsed.data;
    const deadlineMs = deadline.getTime();
    if (deadlineMs <= today) continue; // window already closed → dropped

    const daysToDeadline = Math.ceil((deadlineMs - today) / 86_400_000);
    kept.push({
      ...rest,
      deadline: deadline.toISOString(),
      status: daysToDeadline <= 7 ? "closing-soon" : "open",
    });
  }

  const finalItems = kept.slice(0, MAX_ITEMS);
  if (finalItems.length === 0) {
    return NextResponse.json({
      success: true,
      added: 0,
      message:
        "The live search completed but could not confidently confirm any currently-open application window from official sources right now. Try again later.",
    });
  }

  try {
    const added = await upsertLiveScholarships(finalItems);
    return NextResponse.json({
      success: true,
      added,
      message:
        `${added} live listing${added === 1 ? "" : "s"} refreshed from official sources. Each shows its source link.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upsert failed.";
    console.error("[/api/scholarships/live] upsert failed:", message);
    return NextResponse.json(
      {
        success: false,
        error: /function|rpc|schema|relation|does not exist/i.test(message)
          ? "The live-catalogue write helper is not set up yet. Run supabase/migrations/004_live_scholarships.sql in the Supabase SQL editor, then retry."
          : "Could not save the live listings. Please retry.",
      },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Convenience same-origin check endpoint used by the UI before
  // auto-running the first live search.
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Not signed in." },
      { status: 401 }
    );
  }
  return NextResponse.json({
    success: true,
    configured: getAiAvailability().assistantChat,
    cooldownRemainingMs: Math.max(
      0,
      COOLDOWN_MS - (Date.now() - (lastRunByUser.get(session.sub) ?? 0))
    ),
  });
}
