// ============================================================
// ClaimWise integration verification (run: node verify-integrations.mjs)
// - Loads .env.local; NEVER prints credential values.
// - Gemini: key shape → ListModels auth → configured model → live
//   chat call (multimodal probe optional via MULTIMODAL=1).
// - Supabase: auth health (apikey header), per-table existence
//   probes (PGRST205 = migration not run), private storage bucket.
// ============================================================
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const GEMINI_KEY = env.GOOGLE_GEMINI_API_KEY;
const DEFAULT_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];

const results = [];
const log = (name, ok, detail = "") =>
  results.push({ name, ok, detail: String(detail).replace(GEMINI_KEY ?? "\u0000", "[REDACTED]").replace(SUPABASE_KEY ?? "\u0000", "[REDACTED]") });

// ── Gemini ──
log("Gemini key present", Boolean(GEMINI_KEY), GEMINI_KEY ? `present (${GEMINI_KEY.length} chars)` : "MISSING in .env.local");
let supported = [];
if (GEMINI_KEY) {
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
      headers: { "x-goog-api-key": GEMINI_KEY }, signal: AbortSignal.timeout(30000),
    });
    log("Gemini ListModels / auth", res.ok, `status ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      supported = (data.models ?? []).filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent")).map((m) => m.name.replace("models/", ""));
    }
  } catch (e) { log("Gemini ListModels / auth", false, `network error: ${e.message}`); }

  const chain = (process.env.GEMINI_MODEL?.trim() && [process.env.GEMINI_MODEL.trim()]) || DEFAULT_MODELS;
  log("Configured model chain", true, chain.join(" → ") + (chain.every((m) => supported.includes(m)) ? " (all in ListModels)" : ""));

  if (supported.length && !chain.some((m) => supported.includes(m))) {
    log("Configured model validity", false, `none of the configured models are supported. Available flash models: ${supported.filter((m) => m.includes("flash") && !m.includes("image") && !m.includes("tts")).slice(0, 10).join(", ")}`);
  }

  for (const model of chain) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "Reply with exactly: OK" }] },
          contents: [{ role: "user", parts: [{ text: "Connectivity test. Reply OK." }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 16 },
        }),
        signal: AbortSignal.timeout(90000),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
        log(`Gemini live call: ${model}`, true, `reply "${reply.trim().slice(0, 30)}"`);
        break; // first success is enough
      }
      const body = await res.text().catch(() => "");
      let msg = body.slice(0, 140); try { msg = JSON.parse(body).error?.message; } catch { /* raw */ }
      log(`Gemini live call: ${model}`, res.status !== 503 && res.status !== 404, `status ${res.status} — ${msg ?? ""}`);
    } catch (e) { log(`Gemini live call: ${model}`, false, `network error: ${e.message}`); }
  }

  if (process.env.MULTIMODAL === "1") {
    const tiny = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODELS[0]}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Reply with: IMAGE-PATH-OK" }, { inline_data: { mime_type: "image/png", data: tiny.toString("base64") } }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 24 },
        }),
        signal: AbortSignal.timeout(60000),
      });
      log("Gemini multimodal path", res.ok, res.ok ? "inline_data accepted" : `status ${res.status}`);
    } catch (e) { log("Gemini multimodal path", false, `network error: ${e.message}`); }
  }
}

// ── Supabase ──
log("Supabase URL present", Boolean(SUPABASE_URL), SUPABASE_URL ? `present (${SUPABASE_URL.replace(/^https:\/\/([a-z0-9]{7}).*/, "https://$1***.supabase.co")})` : "MISSING");
try {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: SUPABASE_KEY }, signal: AbortSignal.timeout(20000) });
  const data = res.ok ? await res.json().catch(() => ({})) : {};
  log("Supabase Auth reachable", res.ok, res.ok ? `auth health OK (version ${data.version})` : `status ${res.status}`);
} catch (e) { log("Supabase Auth reachable", false, `network error: ${e.message}`); }

let missing = [];
try {
  for (const t of ["profiles", "documents", "applications", "notifications", "scholarships"]) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, signal: AbortSignal.timeout(20000),
    });
    const body = await res.json().catch(() => null);
    if (res.status === 200) log(`Schema table '${t}'`, true, "exists (RLS active)");
    else {
      const code = body?.code ?? "", msg = body?.message ?? "";
      log(`Schema table '${t}'`, false, `status ${res.status} · ${code} · ${String(msg).slice(0, 110)}`);
      if (code === "PGRST205" || res.status === 404) missing.push(t);
    }
  }
  if (missing.length) {
    log("Migration status", false, `${missing.length}/5 tables missing — run supabase/migrations/001_claimwise_init.sql in the Supabase SQL editor (dashboard), then restart the dev server.`);
  }
} catch (e) { log("Supabase schema probe", false, `network error: ${e.message}`); }

try {
  const u = new URL(SUPABASE_URL);
  const res = await fetch(`${u.protocol}//${u.host}/storage/v1/bucket`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, signal: AbortSignal.timeout(20000),
  });
  const raw = await res.json().catch(() => null);
  const buckets = Array.isArray(raw) ? raw : [];
  const docs = buckets.find((b) => (b.id ?? b.name) === "documents");
  if (docs) {
    const priv = docs.public === false;
    log("Storage bucket 'documents'", true, priv ? "exists (private, metadata readable via 002)" : `exists but flagged public=${docs.public} — expected private`);
  } else {
    log("Storage bucket 'documents'", false, raw && !Array.isArray(raw)
      ? `status ${res.status} · ${String(raw.message ?? "").slice(0, 110)}`
      : (res.status === 200
        ? "hidden by RLS on storage.buckets (bucket may still exist) → run supabase/migrations/002_storage_bucket_readable.sql, then re-run this script"
        : `status ${res.status} → run migration 001 (creates the bucket)`));
  }
} catch (e) { log("Storage probe", false, `network error: ${e.message}`); }

// ── Report ──
console.log("\n===== CLAIMWISE INTEGRATION VERIFICATION =====");
for (const r of results) console.log(`${r.ok ? "✅ PASS" : "❌ FAIL"}  ${r.name}${r.detail ? `\n          ${r.detail}` : ""}`);
const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} checks passed`);
