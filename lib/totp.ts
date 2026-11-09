// ============================================================
// ClaimWise — TOTP (authenticator app) engine
//
// Standard RFC 6238 / RFC 4226 implementation using node:crypto
// only — no third-party account or network call is ever made.
// The owner scans an otpauth:// QR with Google Authenticator /
// Authy / Microsoft Authenticator; the 6-digit app code then
// verifies sensitive actions (same elevation as the SMS OTP).
//
// Security model:
//   • The base32 seed NEVER touches the database in clear text —
//     it is sealed as an AES-256-GCM encrypted JWT in totp_secrets.
//   • Verification accepts ±1 time step (30 s) of clock drift.
//   • A code for one time step cannot simply be guessed from the
//     previous one; each check verifies the HMAC directly.
// ============================================================

import { createHmac, randomBytes } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import { elevationKey } from "./otp";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** 160-bit random seed, RFC 4648 base32 (no padding). */
export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  let out = "";
  let bits = 0;
  let value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function decodeBase32(secret: string): Buffer {
  const clean = secret.replace(/=+$/, "").toUpperCase().replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(key: Buffer, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter % 2 ** 32, 4);
  const digest = createHmac("sha1", key).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(code % 10 ** digits).padStart(digits, "0");
}

export function totpUri(secret: string, account: string): string {
  const label = encodeURIComponent(`ClaimWise:${account}`);
  return (
    `otpauth://totp/${label}?secret=${secret}` +
    `&issuer=ClaimWise&algorithm=SHA1&digits=6&period=30`
  );
}

/** Current 6-digit code for a seed (shared with the QR setup screen). */
export function totpNow(secret: string): string {
  const counter = Math.floor(Date.now() / 1000 / 30);
  return hotp(decodeBase32(secret), counter);
}

/**
 * Verify a user-entered code with ±1 time step of clock drift.
 * Never exposes the secret — pass the base32 seed from decryptSecret.
 */
export function verifyTotp(secret: string, code: string): boolean {
  const clean = (code ?? "").replace(/\D/g, "");
  if (clean.length !== 6) return false;
  const counter = Math.floor(Date.now() / 1000 / 30);
  const key = decodeBase32(secret);
  for (const drift of [-1, 0, 1]) {
    if (hotp(key, counter + drift) === clean) return true;
  }
  return false;
}

// ----------------------------------------------------------------
// Encrypted seed at rest (AES-256-GCM via jose) — key is shared
// with the elevation-cookie key so no extra secret is required.
// ----------------------------------------------------------------

export async function encryptTotpSecret(secret: string, userId: string): Promise<string> {
  return new EncryptJWT({ s: secret, u: userId })
    .setProtectedHeader({ alg: "HS256", enc: "A256GCM" })
    .setIssuedAt()
    .encrypt(elevationKey());
}

export async function decryptTotpSecret(cipher: string): Promise<{ secret: string; userId: string }> {
  const { payload } = await jwtDecrypt(cipher, elevationKey());
  return { secret: String(payload.s ?? ""), userId: String(payload.u ?? "") };
}
