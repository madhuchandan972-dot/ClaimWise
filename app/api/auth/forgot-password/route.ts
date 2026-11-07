// ============================================================
// ClaimWise — POST /api/auth/forgot-password
//
// Sends a REAL password-reset email through Supabase Auth. The
// email links to /auth/callback?next=/reset-password, which
// exchanges the code for a recovery session, then the
// /reset-password page lets the student set a new password.
//
// Enumeration safety is preserved: for any valid input the same
// generic success message is returned, never revealing whether
// the account exists.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/auth";

const GENERIC_MESSAGE =
  "If an account exists for that email, we have sent a password reset link. Check your inbox (and the spam folder).";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Origin of this deployment (never trusts the client-supplied URL).
    const origin = new URL(request.url).origin;
    const result = await sendPasswordResetEmail(email, origin);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Never log or reveal whether the account exists.
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE, demo: false });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unexpected server error. Please try again." },
      { status: 500 }
    );
  }
}
