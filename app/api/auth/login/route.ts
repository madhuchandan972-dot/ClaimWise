// ============================================================
// ClaimWise — POST /api/auth/login
// Authenticates via Supabase Auth (@supabase/ssr server client
// sets the rotating session cookies) and returns a lightweight
// safe payload for the dashboard shell.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/store";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({
    message: "Please provide a valid email address.",
  }),
  password: z.string().min(1, "Password is required."),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const authResult = await authenticateUser(email, password);

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const ws = await getWorkspace(user.id, user.email, user.name);

    // Build a safe payload (no password hashes or internal fields)
    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      profileComplete: ws.profile.profileComplete,
    };

    return NextResponse.json({ success: true, user: userPayload }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/auth/login] Error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
