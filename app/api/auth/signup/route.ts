// ============================================================
// ClaimWise — POST /api/auth/signup
// Creates a Supabase Auth account (and, via the on_auth_user_created
// trigger, a BLANK profile row) and signs the user in immediately
// when email confirmation is disabled on the Supabase project.
//
// No sample/fictional records are ever created for new accounts —
// the workspace starts empty.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.string().trim().email().max(160),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100)
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/[0-9]/, "Password must contain a number."),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = signupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid registration details.",
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    // The redirect target is derived from this server request, never
    // from a client-supplied URL.
    const origin = new URL(request.url).origin;
    const result = await registerUser({ name, email, password }, origin);

    if (!result.success) {
      // Classify the failure honestly instead of collapsing everything
      // into 409 (a conflict means "this email is taken" — an SMTP or
      // provider outage is not a conflict).
      const rateLimited = /too many|rate limit/i.test(result.error);
      const alreadyExists = /already (registered|exists)/i.test(result.error);

      if (rateLimited) {
        return NextResponse.json(
          { success: false, error: result.error, retryAfterSeconds: 60 },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
      if (alreadyExists) {
        return NextResponse.json({ success: false, error: result.error }, { status: 409 });
      }
      // Anything else (confirmation email failed to send, provider
      // unavailable) is a server-side problem, not the user's fault.
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 503 }
      );
    }

    if (result.needsConfirmation) {
      return NextResponse.json(
        {
          success: true,
          needsConfirmation: true,
          message:
            "Account created — check your inbox for the confirmation link before signing in.",
          next: "/login",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: true, next: "/dashboard" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unexpected server error. Please try again." },
      { status: 500 }
    );
  }
}
