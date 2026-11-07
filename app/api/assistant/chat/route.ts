// ============================================================
// ClaimWise — POST /api/assistant/chat
//
// Live AI (Google Gemini) scholarship chat, server-side only:
//   - Session required; the API key never leaves the server.
//   - Grounded in the student's REAL catalogue + applications +
//     profile facts. The model is explicitly instructed NOT to
//     invent schemes, amounts or deadlines.
//   - 503 with an honest error when AI is unconfigured or the
//     provider is down — no silent static replies in production.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { runAssistantReply, describeAiFailure } from "@/lib/ai";
import { getProfile, listApplications, listScholarships } from "@/lib/store";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

/** Builds grounding text from the student's real data (never fabricated). */
async function buildGrounding(
  userId: string
): Promise<{ text: string; warning?: string }> {
  const parts: string[] = [];
  try {
    const profile = await getProfile(userId);
    if (profile) {
      const rows: string[] = [
        ["Home state", profile.state],
        ["Social category", profile.category],
        ["Year of study", profile.year],
        ["Course", profile.course],
        ["College / Institution", profile.college],
        ["Annual family income (INR)", profile.familyIncome ? String(profile.familyIncome) : ""],
      ]
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `- ${k}: ${v}`);
      if (profile.marksPercentage !== undefined) {
        rows.push(`- Latest marks: ${profile.marksPercentage}% (${profile.marksExam || "exam"})`);
      }
      if (rows.length > 0) parts.push(`Profile facts:\n${rows.join("\n")}`);
    }
  } catch (e) {
    return { text: "", warning: describeDbIssue("profile", e) };
  }

  try {
    const catalog = await listScholarships();
    if (catalog.length > 0) {
      // Cap at the 15 closest deadlines to keep the prompt small.
      const open = catalog
        .filter((s) => s.status !== "closed")
        .slice(0, 15);
      const lines = open.map(
        (s) =>
          `- ${s.name} (${s.provider}, ${s.amount}) deadline ${
            new Date(s.deadline).toISOString().slice(0, 10)
          } status ${s.status}${s.isDemo ? " [sample/demo data]" : ""}`
      );
      parts.push(`Open catalogue entries (verified from the app's own table):\n${lines.join("\n")}`);
    } else {
      parts.push(
        "The scholarship catalogue is currently empty on this server. Advise the student that no schemes are loaded yet rather than naming any scheme."
      );
    }
  } catch (e) {
    return { text: "", warning: describeDbIssue("scholarship catalogue", e) };
  }

  try {
    const apps = await listApplications(userId);
    if (apps.length > 0) {
      const lines = apps.slice(0, 10).map(
        (a) => `- ${a.scholarshipName}: status ${a.status}, next action "${a.nextAction ?? "—"}"`
      );
      parts.push(`The student's tracked applications:\n${lines.join("\n")}`);
    }
  } catch {
    // Applications are optional grounding; ignore DB failures here.
  }

  parts.push(
    "Reminders: never invent scholarship names, amounts, deadlines or URLs. Prefer answers grounded in the facts above; otherwise direct the student to official portals (e.g. scholarships.gov.in)."
  );
  return { text: parts.join("\n\n") };
}

function describeDbIssue(source: string, err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/schema|relation|does not exist/i.test(message)) {
    return `The database schema is not initialised yet, so the ${source} could not be loaded. Run supabase/migrations/001_claimwise_init.sql in the Supabase SQL editor.`;
  }
  return `The ${source} is temporarily unavailable.`;
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Send 'messages' as an array of {role, content} (max 20)." },
      { status: 400 }
    );
  }

  const grounding = await buildGrounding(session.sub);

  const result = await runAssistantReply(parsed.data.messages, grounding.text);

  if (result.mode === "unavailable") {
    return NextResponse.json(
      { success: false, error: result.reply, reason: result.reason },
      { status: 503 }
    );
  }
  if (result.mode === "error") {
    return NextResponse.json(
      { success: false, error: result.reason, groundingWarning: grounding.warning },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    reply: result.reply,
    mode: result.mode,
    groundingWarning: grounding.warning,
  });
}
