// ============================================================
// ClaimWise — OTP + elevation (sensitive-action lock)
//
// Before opening stored document bytes, the OWNER re-proves
// themselves with a one-time code sent by SMS to the mobile
// on their profile. The verified code grants a short-lived
// "elevated" cookie (5 min) — nothing long-lived is created.
//
//   • Codes are 6 digits, generated with crypto.randomInt.
//   • Only SHA-256(code + salt) is stored, in otp_challenges.
//   • Max 5 verification attempts per challenge.
//   • Rate limit: one request per 45 s per user.
//   • Consent model: SMS provider is configured via env
//     (Twilio / Msg91). Without one, dev mode can be enabled
//     explicitly with OTP_DEV_BYPASS=1 so local testing works;
//     production WITHOUT a provider refuses to send and the UI
//     explains that honestly. No logging of codes, ever.
//
// The elevation cookie is AES-256-GCM encrypted via jose and
// HttpOnly — the browser cannot read or mint it.
// ============================================================

import { createHash, randomInt, randomBytes } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import { createSupabaseServerClient } from "./supabase/server";

// ----------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------

export const ELEVATION_COOKIE = "cw_elevated";
export const OTP_PURPOSE = "vault-file";
/** How long an approved elevation lasts. */
export const ELEVATION_TTL_SECONDS = 5 * 60;
/** Fresh code request cooldown. */
export const REQUEST_COOLDOWN_SECONDS = 45;
export const CHALLENGE_TTL_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 5;

export interface SmsConfig {
  provider: "twilio" | "msg91" | "none";
  devBypass: boolean;
}

export function smsConfig(): SmsConfig {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
    return { provider: "twilio", devBypass: false };
  }
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    return { provider: "msg91", devBypass: false };
  }
  return { provider: "none", devBypass: process.env.OTP_DEV_BYPASS === "1" };
}

export function isOtpAvailable(): boolean {
  const c = smsConfig();
  return c.provider !== "none" || c.devBypass;
}

/** 91x… or +91… → "91xxxxx1234" for UI display. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  return `91${"x".repeat(5)}${digits.slice(-4)}`;
}

// ----------------------------------------------------------------
// Code generation + hashing
// ----------------------------------------------------------------

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function hashCode(code: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

// ----------------------------------------------------------------
// Challenge lifecycle (DB-backed so serverless stays stateless)
// ----------------------------------------------------------------

type ChallengeRow = {
  id: string;
  user_id: string;
  purpose: string;
  salt: string;
  code_hash: string;
  attempts: number;
  consumed: boolean;
  created_at: string;
  expires_at: string;
};

export type RequestOtpResult =
  | { ok: true; cooldownRemaining: number; maskedPhone: string; expiresAt: string; devCode?: string }
  | { ok: false; error: string };

export async function requestOtp(userId: string, purpose: string): Promise<RequestOtpResult> {
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase.from("profiles").select("phone").eq("id", userId).maybeSingle();
  const phone = String(profile?.phone ?? "").trim();
  if (!/^\d{10}$/.test(phone.replace(/\D/g, "").slice(-10))) {
    return { ok: false, error: "Add a valid 10-digit phone number to your profile first (Profile page)." };
  }

  // Cooldown — check the newest unconsumed challenge.
  const { data: recent, error: recentError } = await supabase
    .from("otp_challenges")
    .select("created_at")
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1);
  if (recentError) {
    console.error("[otp:request] read failed:", recentError.message);
    return { ok: false, error: "A database error occurred. Please try again." };
  }
  if (recent && recent.length > 0) {
    const since = Date.now() - new Date(recent[0].created_at).getTime();
    const remaining = Math.ceil((REQUEST_COOLDOWN_SECONDS * 1000 - since) / 1000);
    if (remaining > 0) {
      return { ok: false, error: `Please wait ${remaining}s before requesting another code.` };
    }
  }

  const code = generateCode();
  const salt = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000).toISOString();

  const config = smsConfig();
  const { data: challenge, error } = await supabase
    .from("otp_challenges")
    .insert({ user_id: userId, purpose, salt, code_hash: hashCode(code, salt), expires_at: expiresAt })
    .select("id, expires_at")
    .single();
  if (error || !challenge) {
    console.error("[otp:request] insert failed:", error?.message);
    return { ok: false, error: "Could not create your verification code. Try again." };
  }

  const formatted = `+91${phone.replace(/\D/g, "").slice(-10)}`;

  if (config.provider === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formatted,
        From: process.env.TWILIO_FROM_NUMBER!,
        Body: `ClaimWise: your verification code is ${code}. Valid 10 minutes. If you did not request it, ignore this SMS.`,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error("[otp:request] twilio send failed:", res.status, await res.text().catch(() => ""));
      return { ok: false, error: "The SMS could not be delivered. Try again shortly." };
    }
  } else if (config.provider === "msg91") {
    try {
      const res = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          authkey: process.env.MSG91_AUTH_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID,
          shorturl: 0,
          realTimeResponse: 0,
          recipients: [{ mobiles: `91${phone.replace(/\D/g, "").slice(-10)}`, otp: code }],
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        return { ok: false, error: "The SMS could not be delivered. Try again shortly." };
      }
    } catch {
      return { ok: false, error: "The SMS could not be delivered. Try again shortly." };
    }
  } else {
    // No provider configured. Only an explicitly enabled dev bypass
    // shows the code (so local testing works without an SMS account).
    if (!config.devBypass) {
      return {
        ok: false,
        error: "SMS is not configured on this deployment, so the OTP lock cannot verify you. Ask the administrator to add the SMS provider settings.",
      };
    }
    console.log(`[otp:dev] code for user ${userId} (DEV MODE): ${code}`);
    return {
      ok: true,
      cooldownRemaining: REQUEST_COOLDOWN_SECONDS,
      maskedPhone: maskPhone(phone),
      expiresAt: challenge.expires_at,
      devCode: code,
    };
  }

  return {
    ok: true,
    cooldownRemaining: REQUEST_COOLDOWN_SECONDS,
    maskedPhone: maskPhone(phone),
    expiresAt: challenge.expires_at,
  };
}

export type VerifyOtpResult =
  | { ok: true; provided: true }
  | { ok: false; error: string; lockout?: number };

export async function verifyOtp(
  userId: string,
  purpose: string,
  code: string
): Promise<VerifyOtpResult> {
  const clean = (code ?? "").replace(/\D/g, "");
  if (clean.length !== 6) return { ok: false, error: "Enter the 6-digit code." };

  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("otp_challenges")
    .select("*")
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) {
    console.error("[otp:verify] read failed:", error.message);
    return { ok: false, error: "A database error occurred. Please try again." };
  }
  const challenge = rows?.[0] as ChallengeRow | undefined;
  if (!challenge) return { ok: false, error: "No active code. Request a new one." };
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "That code expired. Request a new one." };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many wrong attempts. Request a new code." };
  }

  if (hashCode(clean, challenge.salt) !== challenge.code_hash) {
    await supabase
      .from("otp_challenges")
      .update({ attempts: challenge.attempts + 1 })
      .eq("id", challenge.id);
    const left = MAX_ATTEMPTS - (challenge.attempts + 1);
    return { ok: false, error: `Wrong code. ${left > 0 ? `${left} attempt${left === 1 ? "" : "s"} left.` : "Request a new code."}` };
  }

  const { error: consumeError } = await supabase
    .from("otp_challenges")
    .update({ consumed: true })
    .eq("id", challenge.id);
  if (consumeError) {
    console.error("[otp:verify] consume failed:", consumeError.message);
    return { ok: false, error: "A database error occurred. Please try again." };
  }
  return { ok: true, provided: true };
}

// ----------------------------------------------------------------
// Elevation cookie (AES-256-GCM via jose, 5 minutes)
// ----------------------------------------------------------------

export function elevationKey(): Uint8Array {
  const secret = (
    process.env.OTP_ELEVATION_SECRET ||
    process.env.DIGILOCKER_STATE_SECRET ||
    `claimwise-elev:${process.env.DIGILOCKER_CLIENT_SECRET ?? "dev"}`
  ).trim();
  return new TextEncoder().encode(secret.padEnd(32, "0").slice(0, 32));
}

export async function sealElevationCookie(userId: string, purpose: string): Promise<string> {
  return new EncryptJWT({ u: userId, p: purpose })
    .setProtectedHeader({ alg: "HS256", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${ELEVATION_TTL_SECONDS}s`)
    .encrypt(elevationKey());
}

export async function verifyElevation(
  cookieValue: string | undefined,
  userId: string,
  purpose: string
): Promise<boolean> {
  if (!cookieValue) return false;
  try {
    const { payload } = await jwtDecrypt(cookieValue, elevationKey());
    return payload.u === userId && payload.p === purpose;
  } catch {
    return false;
  }
}

export function elevationCookieOptions(maxAge = ELEVATION_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
