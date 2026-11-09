// ============================================================
// ClaimWise — DigiLocker integration (official government fetcher)
//
// DigiLocker is India's official document wallet run by MeitY /
// NeGD. With the partner OAuth flow the USER authorises their OWN
// Aadhaar-linked DigiLocker account, and ClaimWise can then fetch
// THAT user's documents (driving licence, RC, certificates,
// policy documents…) straight from DigiLocker's servers into the
// vault. There is no other legitimate path to auto-fetching
// government-issued files.
//
// Requirements to go live (out of our hands, by design):
//   • Apply as a partner at https://partners.digilocker.gov.in
//     (a DigiLocker/NeGD review — you receive client id + secret)
//   • Register the redirect URI:
//     https://<your-domain>/api/digilocker/callback
//   • Put the credentials in DIGILOCKER_CLIENT_ID /
//     DIGILOCKER_CLIENT_SECRET
//
// Security model:
//   • Access tokens live ONLY in a short-lived, encrypted (AES-GCM
//     via jose) HttpOnly cookie. They are never written to the DB,
//     never sent to the browser and never logged.
//   • CSRF: `start` sets an HttpOnly state cookie verified in
//     `callback` before the token exchange.
//   • Downloaded bytes are validated (must be application/pdf)
//     and size-capped, then stored through the same addDocument
//     path as manual uploads (private bucket + RLS).
//
// NOTE: endpoint paths below follow the DigiLocker Partner API v1
// documentation. They are centralised here so that if sandbox vs
// production paths differ, only this file changes.
// ============================================================

import { EncryptJWT, jwtDecrypt } from "jose";

// ----------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------

const DEFAULT_API_BASE = "https://www.digilocker.gov.in/public/oauth2";

export const DL_TOKEN_COOKIE = "dlg_token";
export const DL_STATE_COOKIE = "dlg_state";
/** DigiLocker access tokens live ~1 hour. Refresh slightly early. */
const TOKEN_COOKIE_TTL_SECONDS = 55 * 60;

export interface DigilockerConfig {
  clientId: string;
  clientSecret: string;
  apiBase: string;
  authorizeUrl: string;
  tokenUrl: string;
}

export function getDigilockerConfig(): DigilockerConfig | null {
  const clientId = process.env.DIGILOCKER_CLIENT_ID?.trim();
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  const apiBase = (process.env.DIGILOCKER_API_BASE?.trim() || DEFAULT_API_BASE).replace(/\/$/, "");
  return {
    clientId,
    clientSecret,
    apiBase,
    authorizeUrl: `${apiBase}/1/authorize/og`,
    tokenUrl: `${apiBase}/1/token`,
  };
}

export function isDigilockerConfigured(): boolean {
  return getDigilockerConfig() !== null;
}

/** Redirect URI — env override for sandbox, otherwise request origin + path. */
export function redirectUri(request: Request): string {
  const override = process.env.DIGILOCKER_REDIRECT_URI?.trim();
  if (override) return override;
  return `${new URL(request.url).origin}/api/digilocker/callback`;
}

/** Key material used to encrypt the short-lived token cookie. */
function cookieKey(): Uint8Array {
  const secret = (
    process.env.DIGILOCKER_STATE_SECRET ||
    `claimwise-dlg:${process.env.DIGILOCKER_CLIENT_SECRET ?? "dev"}`
  ).trim();
  // 32-byte key from arbitrary-length secret (jose requires it).
  return new TextEncoder().encode(secret.padEnd(32, "0").slice(0, 32));
}

export async function sealTokenCookie(token: string): Promise<string> {
  return new EncryptJWT({ t: token })
    .setProtectedHeader({ alg: "HS256", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_COOKIE_TTL_SECONDS}s`)
    .encrypt(cookieKey());
}

export async function unsealTokenCookie(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  try {
    const { payload } = await jwtDecrypt(value, cookieKey());
    const t = (payload as { t?: string }).t;
    return t ?? null;
  } catch {
    return null;
  }
}

export function tokenCookieOptions(maxAge = TOKEN_COOKIE_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

// ----------------------------------------------------------------
// OAuth + file APIs
// ----------------------------------------------------------------

export interface DlgTokenResponse {
  accessToken: string;
  expiresIn: number; // seconds
}

/** Exchanges the OAuth `code` for an access token. */
export async function exchangeCode(
  code: string,
  config: DigilockerConfig,
  redirect_uri: string
): Promise<DlgTokenResponse> {
  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri,
      code,
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const data = (await res.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } | null;

  if (!res.ok || !data?.access_token) {
    throw new Error(
      data?.error_description || data?.error || `DigiLocker token exchange failed (${res.status}).`
    );
  }
  return {
    accessToken: data.access_token,
    expiresIn: Math.min(Number(data.expires_in) || 3600, 3600),
  };
}

export interface DlgFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

/** Lists the fetching user's own DigiLocker drive files. */
export async function listFiles(accessToken: string, config: DigilockerConfig): Promise<DlgFile[]> {
  const res = await fetch(`${config.apiBase}/1/files`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(30_000),
  });

  if (res.status === 401) throw new Error("session-expired");
  if (!res.ok) throw new Error(`DigiLocker file listing failed (${res.status}).`);

  const data = (await res.json().catch(() => null)) as
    | { data?: unknown[]; files?: unknown[] }
    | null;

  const raw = data?.data ?? data?.files ?? [];
  const files: DlgFile[] = [];
  for (const item of raw as Array<Record<string, unknown>>) {
    if (!item) continue;
    const id = String(item["id"] ?? item["fileId"] ?? "").trim();
    const name = String(item["name"] ?? item["filename"] ?? "").trim();
    if (!id || !name) continue;
    if (String(item["parent"] ?? item["type"] ?? "").toLowerCase() === "folder") continue;
    files.push({
      id,
      name,
      mimeType: String(item["mime"] ?? item["mime_type"] ?? item["mimeType"] ?? "application/pdf"),
      size: Number(item["size"] ?? item["filesize"] ?? 0),
    });
  }
  return files;
}

/** Downloads one file's bytes from DigiLocker's servers. */
export async function downloadFile(
  fileId: string,
  accessToken: string,
  config: DigilockerConfig
): Promise<{ mime: string; data: Buffer }> {
  const res = await fetch(`${config.apiBase}/1/file/${encodeURIComponent(fileId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(60_000),
  });

  if (res.status === 401) throw new Error("session-expired");
  if (!res.ok) throw new Error(`DigiLocker download failed (${res.status}).`);

  // DigiLocker issued files are PDFs; verify bytes rather than trusting headers.
  const data = Buffer.from(await res.arrayBuffer());
  if (!(data.length > 4 && data.subarray(0, 5).toString("latin1") === "%PDF-")) {
    throw new Error("DigiLocker returned something other than a PDF file.");
  }
  return { mime: "application/pdf", data };
}

/** Maps a DigiLocker file to a sensible vault category. */
export function guessVaultCategory(name: string, mimeType: string): string {
  const n = name.toLowerCase();
  if (n.includes("aadhaar")) return "AadhaarCard";
  if (n.includes("pan")) return "PANCard";
  if (/dl\b|driving|licence|license/.test(n)) return "Other";
  if (n.includes("rc") && (n.includes("vehicle") || n.includes("regi"))) return "PropertyDocument";
  if (n.includes("policy")) return "InsuranceDocument";
  if (n.includes("income")) return "IncomeCertificate";
  if (n.includes("caste")) return "CasteCertificate";
  if (n.includes("marks") || n.includes("marksheet") || n.includes("certificate")) {
    return "MarksCard";
  }
  return "Other";
}
