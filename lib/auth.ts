// ============================================================
// ClaimWise Platform — Auth Module (Supabase Auth)
//
// ⚠️ DEVELOPMENT DEMO → PRODUCTION upgrade, now wired to Supabase:
//
//   ✅ Real auth service (Supabase Auth) — bcrypt-hashed passwords,
//      rotating JWT access tokens, real server-side revocation
//   ✅ Cookie-based sessions shared between browser, API routes and
//      Edge middleware via @supabase/ssr
//   ✅ Session verified server-side in EVERY API (getUser performs a
//      real JWT validation against Supabase Auth)
//   ✅ Enumeration-safe password reset via a real reset email
//
//   The previous in-memory user Map + jose HS256 self-signed cookie
//   flow has been replaced. Signing secret handling is Supabase's
//   responsibility now — no NEXTAUTH_SECRET dependency remains.
// ============================================================

import { createSupabaseServerClient } from "./supabase/server";

// ----------------------------------------------------------------
// Session payload (same shape as before, so call sites can keep
// reading sub / email / name / demo)
// ----------------------------------------------------------------

export interface SessionPayload {
  sub: string; // Supabase auth user id (uuid)
  email: string;
  name: string; // display name from the profiles table
  demo: boolean; // true for the flagged demo account (profiles.is_demo)
}

/**
 * Reads the signed-in user from the Supabase session cookies.
 * Null if not signed in. Cookies only — never accepts tokens from
 * query strings or client-supplied headers.
 *
 * Kept request-compatible with the previous signature (the request
 * object is intentionally unused; cookies come from next/headers).
 */
export async function getSessionFromRequest(
  _request: Request
): Promise<SessionPayload | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  // Display name + demo flag live in the profiles table (created by
  // the on_auth_user_created trigger when the auth user is created).
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, is_demo")
    .eq("id", user.id)
    .maybeSingle();

  return {
    sub: user.id,
    email: user.email.toLowerCase(),
    name: profile?.name ?? "Student",
    demo: profile?.is_demo === true,
  };
}

// ----------------------------------------------------------------
// Register / authenticate (Supabase Auth)
// ----------------------------------------------------------------

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

export type RegisterResult =
  | { success: true; userId: string; name: string; needsConfirmation: boolean }
  | { success: false; error: string };

export async function registerUser(
  payload: RegisterUserPayload,
  origin?: string
): Promise<RegisterResult> {
  const email = payload.email.trim().toLowerCase();

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      data: { full_name: payload.name.trim() },
      // Email verification link lands on the PKCE callback, which
      // exchanges the code for a session and continues to the vault.
      emailRedirectTo: origin
        ? `${origin}/auth/callback?next=/dashboard`
        : undefined,
    },
  });

  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }
  if (!data.user) {
    return { success: false, error: "Account creation failed. Please try again." };
  }

  // The on_auth_user_created trigger (migration 001) creates the blank
  // profile row as SECURITY DEFINER, so it succeeds even though this
  // request is still anonymous.
  //
  // When "Confirm email" is ON there is no session yet, and `profiles`
  // RLS (auth.uid() = id) correctly rejects any write from an anonymous
  // caller — attempting it only produced a misleading "run migration?"
  // error on every signup. So write the row here only when Supabase
  // returned a session; otherwise the trigger owns it, and the first
  // authenticated request self-heals a missing row via ensureProfile().
  // Either way the row is blank — never seeded with sample records.
  if (data.session) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      { id: data.user.id, email, name: payload.name.trim() },
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (profileError) {
      console.error(
        "[registerUser] profile row could not be created:",
        profileError.message
      );
    }
  }

  return {
    success: true,
    userId: data.user.id,
    name: payload.name.trim(),
    // When "Confirm email" is enabled in Supabase Auth there is no
    // session yet; the user must click the emailed confirmation link
    // (→ /auth/callback) before signing in.
    needsConfirmation: !data.session,
  };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<
  | { success: true; user: { id: string; email: string; name: string } }
  | { success: false; error: string }
> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return { success: false, error: mapAuthError(error?.message ?? "Invalid login credentials.") };
  }

  // The server client has already set the refreshed session cookies.
  // Name comes from the profile row when available.
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    success: true,
    user: {
      id: data.user.id,
      email: email.trim().toLowerCase(),
      name: profile?.name ?? "Student",
    },
  };
}

// ----------------------------------------------------------------
// Password reset — real email via Supabase Auth
// ----------------------------------------------------------------

/**
 * Sends a real password-reset email. Always resolves to success for
 * valid input — never reveals whether the account exists
 * (enumeration-safe, same guarantee as before).
 */
export async function sendPasswordResetEmail(
  email: string,
  origin: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    // Invalid-config errors are safe to surface; missing accounts are not.
    if (/invalid/i.test(error.message) && /email/i.test(error.message)) {
      return { success: false, error: "Please enter a valid email address." };
    }
    console.error("[sendPasswordResetEmail] Supabase error:", error.message);
  }

  return { success: true };
}

// ----------------------------------------------------------------
// Error mapping — Supabase messages → the friendly copy the UI
// already expects.
// ----------------------------------------------------------------

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email first — check your inbox for the confirmation link.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "An account with this email already exists.";
  }
  if (m.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (m.includes("at least 6") || m.includes("should be at least")) {
    return "Password must be at least 8 characters with a letter and a number.";
  }
  if (m.includes("valid email") || m.includes("invalid format")) {
    return "Please provide a valid email address.";
  }
  return message;
}
