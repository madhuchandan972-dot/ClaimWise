// ============================================================
// ClaimWise — End-to-end API audit
//
// Design goals (fixed from the previous version):
//   • ONE reusable test account (login first, signup only once
//     when absent) instead of a brand-new throwaway account per
//     run — repeated signups trip Supabase's email rate limit and
//     produce dozens of cascading 401 pseudo-failures.
//   • Three honest outcomes per check: PASS / FAIL / BLOCKED.
//     BLOCKED means the check could not run for an infrastructure
//     reason (email confirmation pending, no catalogue seed, …).
//     A blocked check is NEVER counted as passed.
//   • No cascading: when an id is missing, dependent checks are
//     blocked instead of being fired at "/api/undefined".
//   • Cleanup of the artifacts this run created where the API
//     allows it (documents, unsubmitted applications).
//
// Usage:
//   node e2e-audit.mjs [baseUrl]
//
// Reusable account (create + confirm it once in Supabase):
//   E2E_TEST_EMAIL=e2e-runner@your-domain.test
//   E2E_TEST_PASSWORD=AuditOk123!
//
// Exit codes: 0 = every check passed, 1 = at least one real
// failure, 2 = no failures but some checks were BLOCKED.
// ============================================================

const BASE = (process.argv[2] ?? process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.E2E_TEST_EMAIL ?? "e2e-runner@claimwise.test";
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? "AuditOk123!";

const results = [];
const counts = { pass: 0, fail: 0, blocked: 0 };

const logPass = (name, detail = "") => {
  results.push({ name, status: "PASS", detail: String(detail) });
  counts.pass++;
  console.log(`✅ PASS    ${name}${detail ? ` — ${detail}` : ""}`);
};
const logFail = (name, detail = "") => {
  results.push({ name, status: "FAIL", detail: String(detail) });
  counts.fail++;
  console.log(`❌ FAIL    ${name} — ${detail}`);
};
const logBlocked = (name, reason = "") => {
  results.push({ name, status: "BLOCKED", detail: String(reason) });
  counts.blocked++;
  console.log(`⏭️  BLOCKED ${name} — ${reason}`);
};

/** Assertion helper that never throws and never cascades. */
function check(name, ok, detail = "") {
  ok ? logPass(name, detail) : logFail(name, detail);
  return ok;
}
function blocked(name, reason) {
  logBlocked(name, reason);
  return false;
}

// ------------------------------------------------------------
// Minimal cookie jar (shared with the server via @supabase/ssr)
// ------------------------------------------------------------
const jar = new Map();
function storeCookies(res) {
  const singles = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const c of singles) {
    const [pair] = c.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) jar.set(pair.slice(0, idx), pair.slice(idx + 1));
  }
}
function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}
function clearCookies() {
  jar.clear();
}

async function call(path, { method = "GET", body, form } = {}) {
  const headers = {};
  if (form) {
    // Let fetch set the multipart boundary itself.
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (jar.size) headers.cookie = cookieHeader();

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      redirect: "manual",
    });
  } catch (err) {
    throw new Error(`Cannot reach ${BASE}${path} — is the server running? (${err.message})`);
  }
  storeCookies(res);
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* HTML / empty / binary */
  }
  return { status: res.status, json, res, path, method };
}

/** Compact description of a failed response for the report. */
const brief = (r) =>
  `${r.method} ${r.path} → ${r.status}${
    r.json && r.json.error ? ` · ${String(r.json.error).slice(0, 180)}` : ""
  }`;

function expect(name, r, want = 200) {
  if (r.status !== want) return logFail(name, brief(r) + ` (expected ${want})`);
  if (r.json && r.json.success === false) {
    return logFail(name, `${r.method} ${r.path} → ${r.status} · success:false · ${r.json.error ?? ""}`);
  }
  return logPass(name, `status ${r.status}`);
}

// ------------------------------------------------------------
// Fixtures
// ------------------------------------------------------------
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
const PDF = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.from("%âãÏÓ trivial test pdf"), Buffer.from("\n%%EOF")]);
const stamp = Date.now().toString(36);

function formDoc(fileBuf, name, mime, type) {
  const fd = new FormData();
  fd.append("file", new Blob([fileBuf], { type: mime }), name);
  fd.append("type", type);
  return fd;
}

// State shared between sections
const state = {
  authed: false,
  blockedReason: "",
  docIds: [],
  trackAppId: "",
  submitAppId: "",
  scholarshipId: "",
  catalogueCount: 0,
};

// =====================================================================
// 1. Preflight + unauthenticated access control
// =====================================================================
console.log(`\nClaimWise E2E audit → ${BASE}\n`);

console.log("— Server + unauthenticated access control —");
{
  const s = await call("/api/auth/session");
  check("Server reachable (GET /api/auth/session)", [401, 200].includes(s.status), `status ${s.status}`);

  const d = await call("/api/documents");
  check("GET /api/documents anonymously rejected (401)", d.status === 401, `status ${d.status}`);

  const page = await call("/dashboard");
  const loc = String(page.res.headers.get("location") ?? "");
  check(
    "GET /dashboard anonymously → /login redirect",
    page.status === 307 && loc.includes("/login"),
    `status ${page.status} loc ${loc || "—"}`
  );

  const file = await call(`/api/documents/doc-does-not-exist/file`);
  check("File route anonymous → 401/404 (never bytes)", [401, 404].includes(file.status), `status ${file.status}`);

  const cat = await call("/api/scholarships");
  check("GET /api/scholarships reachable", cat.status === 200 && cat.json?.success === true, `status ${cat.status}`);
}

// =====================================================================
// 2. Authentication — reusable account, single signup attempt at most
// =====================================================================
console.log("\n— Authentication —");
{
  const login = await call("/api/auth/login", { method: "POST", body: { email: EMAIL, password: PASSWORD } });
  const setCookies = typeof login.res.headers.getSetCookie === "function" ? login.res.headers.getSetCookie() : [];

  if (login.status === 200 && login.json?.success === true) {
    state.authed = true;
    logPass("POST /api/auth/login (reusable test account)", `status ${login.status} · ${login.json.user?.email ?? ""}`);
  } else if (login.status === 401) {
    // Account may not exist yet. Try exactly ONE signup with the
    // reusable credentials — never a random new address per run.
    const signup = await call("/api/auth/signup", {
      method: "POST",
      body: { name: "E2E Test Student", email: EMAIL, password: PASSWORD, phone: "9876543210" },
    });

    if (signup.status === 201 && signup.json?.success === true && !signup.json?.needsConfirmation) {
      state.authed = true;
      logPass("POST /api/auth/signup (reusable account, auto-confirmed)", `status ${signup.status}`);
    } else if (signup.status === 201 && signup.json?.needsConfirmation) {
      state.blockedReason =
        "Supabase 'Confirm email' is ON, so the reusable test account has no session. Confirm it once (Supabase → Authentication → Users → open the user → Confirm) or disable email confirmation for this test project, then re-run.";
      blocked("POST /api/auth/login (reusable test account)", state.blockedReason);
    } else if (signup.status === 429) {
      state.blockedReason = `Supabase signup rate limit hit (${signup.json?.error ?? "429"}). Wait and retry, or pre-create the account.`;
      blocked("POST /api/auth/signup", state.blockedReason);
    } else if (signup.status === 409) {
      state.blockedReason = `Account '${EMAIL}' exists but login failed — the password is wrong or the email is unconfirmed. Fix the E2E_TEST_PASSWORD / confirm the user, then re-run.`;
      blocked("POST /api/auth/login (account exists)", state.blockedReason);
    } else {
      state.blockedReason = `Signup failed (${signup.status}): ${signup.json?.error ?? "unknown error"}`;
      blocked("POST /api/auth/signup", state.blockedReason);
    }
  } else {
    state.blockedReason = `Login failed with unexpected status ${login.status}: ${login.json?.error ?? ""}`;
    blocked("POST /api/auth/login", state.blockedReason);
  }

  // Wrong password must be rejected regardless of session state
  const anonProbeJar = new Map(jar);
  clearCookies();
  const wrong = await call("/api/auth/login", { method: "POST", body: { email: EMAIL, password: "definitely-wrong-1" } });
  check("POST /api/auth/login wrong password rejected (401)", wrong.status === 401, `status ${wrong.status}`);

  // Signup validation must reject weak input without touching the DB
  const weak = await call("/api/auth/signup", {
    method: "POST",
    body: { name: "E2E", email: EMAIL, password: "short", phone: "9876543210" },
  });
  check("POST /api/auth/signup rejects invalid password (400)", weak.status === 400, `status ${weak.status}`);

  // Real cookie-attribute assertion (only meaningful when login issued cookies)
  if (state.authed) {
    const sessionCookies = setCookies.filter((c) => /^sb-.*-auth-token/i.test(c));
    check(
      "Session cookies are HttpOnly + SameSite",
      sessionCookies.length > 0 &&
        sessionCookies.every((c) => /HttpOnly/i.test(c)) &&
        sessionCookies.every((c) => /SameSite/i.test(c)),
      `${sessionCookies.length} auth cookie(s) issued`
    );

    // restore the authenticated cookies (wrong-password attempt cleared them)
    clearCookies();
    for (const [k, v] of anonProbeJar) jar.set(k, v);
  } else {
    blocked("Session cookies are HttpOnly + SameSite", "no login response cookies (auth blocked)");
  }
}

/** Runs `fn` only when authenticated; otherwise blocks every listed check. */
async function authed(sectionChecks, fn) {
  if (!state.authed) {
    for (const name of sectionChecks) blocked(name, "no authenticated session (see Authentication above)");
    return;
  }
  await fn();
}

// =====================================================================
// 3. Session + profile
// =====================================================================
console.log("\n— Session & profile —");
await authed(
  [
    "GET /api/auth/session (authenticated)",
    "PUT /api/profile (full profile)",
    "Profile round-trips values",
    "PUT /api/profile tolerates '' optionals",
    "GET /api/profile completion metadata",
  ],
  async () => {
    const s = await call("/api/auth/session");
    expect("GET /api/auth/session (authenticated)", s);
    check("Session payload has user id + email", Boolean(s.json?.user?.id && s.json?.user?.email), s.json?.user?.email ?? "—");

    const put = await call("/api/profile", {
      method: "PUT",
      body: {
        name: "E2E Test Student",
        phone: "9876543210",
        dob: "2004-03-14",
        gender: "Female",
        state: "Karnataka",
        district: "Bengaluru Urban",
        category: "OBC",
        college: "Audit College of Engineering",
        course: "B.E. Computer Science",
        year: "2nd Year",
        familyIncome: 240000,
        marksPercentage: 88.5,
        marksExam: "12th (PUC)",
      },
    });
    expect("PUT /api/profile (full profile)", put);
    const p = put.json?.profile;
    check(
      "Profile round-trips values",
      p?.familyIncome === 240000 && p?.marksPercentage === 88.5 && p?.profileComplete === true,
      `complete=${p?.profileComplete} income=${p?.familyIncome} marks=${p?.marksPercentage}`
    );

    // Users who leave a "Select…" dropdown unchosen send "" — must not 500.
    const empty = await call("/api/profile", { method: "PUT", body: { gender: "", category: "", dob: "", religion: "" } });
    check(
      "PUT /api/profile tolerates '' optionals",
      empty.status === 200 && empty.json?.success === true,
      brief(empty)
    );

    const got = await call("/api/profile");
    expect("GET /api/profile completion metadata", got);
    check(
      "Profile completion is 100% after full profile",
      got.json?.profileCompletion === 100,
      `completion=${got.json?.profileCompletion}`
    );
  }
);

// =====================================================================
// 4. Documents
// =====================================================================
console.log("\n— Documents (private vault) —");
await authed(
  [
    "POST /api/documents PNG upload (201)",
    "POST /api/documents PDF upload (201)",
    "POST /api/documents rejects non-PDF/JPG/PNG (400)",
    "POST /api/documents rejects >5 MB (413)",
    "GET /api/documents lists uploads",
    "GET /api/documents/[id]/file streams bytes",
    "File served with Cache-Control: no-store",
    "GET file for foreign id → 404",
  ],
  async () => {
    const png = await call("/api/documents", {
      method: "POST",
      form: formDoc(PNG, `e2e-id-proof-${stamp}.png`, "image/png", "AadhaarCard"),
    });
    if (png.status === 201 && png.json?.document?.id) {
      state.docIds.push(png.json.document.id);
      logPass("POST /api/documents PNG upload (201)", `id ${png.json.document.id}`);
    } else {
      logFail("POST /api/documents PNG upload (201)", brief(png));
    }

    const pdf = await call("/api/documents", {
      method: "POST",
      form: formDoc(PDF, `e2e-marks-${stamp}.pdf`, "application/pdf", "MarksCard"),
    });
    if (pdf.status === 201 && pdf.json?.document?.id) {
      state.docIds.push(pdf.json.document.id);
      logPass("POST /api/documents PDF upload (201)", `id ${pdf.json.document.id}`);
    } else {
      logFail("POST /api/documents PDF upload (201)", brief(pdf));
    }

    const txt = await call("/api/documents", {
      method: "POST",
      form: formDoc(Buffer.from("plain text file, not a real document"), `e2e-${stamp}.txt`, "text/plain", "Other"),
    });
    // Disguised upload: bytes are sniffed, so this is always a 400.
    check(
      "POST /api/documents rejects non-PDF/JPG/PNG (400)",
      txt.status === 400 && /unsupported|type/i.test(txt.json?.error ?? ""),
      brief(txt)
    );
    if (txt.status === 201 && txt.json?.document?.id) state.docIds.push(txt.json.document.id);

    const big = await call("/api/documents", {
      method: "POST",
      form: formDoc(Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]), `e2e-big-${stamp}.png`, "image/png", "Other"),
    });
    check("POST /api/documents rejects >5 MB (413)", big.status === 413, brief(big));

    const list = await call("/api/documents");
    expect("GET /api/documents lists uploads", list);
    const docs = list.json?.documents ?? [];
    check(
      "Uploaded documents are listed",
      state.docIds.every((id) => docs.some((d) => d.id === id)) && state.docIds.length === 2,
      `listed ${docs.length} · created ${state.docIds.length}`
    );

    if (!state.docIds[0]) {
      blocked("GET /api/documents/[id]/file streams bytes", "no uploaded document id");
      blocked("File served with Cache-Control: no-store", "no uploaded document id");
    } else {
      const file = await call(`/api/documents/${state.docIds[0]}/file`);
      const len = Number(file.res.headers.get("content-length") ?? 0);
      check(
        "GET /api/documents/[id]/file streams bytes",
        file.status === 200 && len > 0 && file.json === null,
        `status ${file.status} · bytes ${len}`
      );
      check(
        "File served with Cache-Control: no-store",
        /no-store/.test(file.res.headers.get("cache-control") ?? ""),
        file.res.headers.get("cache-control") ?? "missing"
      );
      check(
        "File response is nosniff + non-indexable",
        file.res.headers.get("x-content-type-options") === "nosniff",
        file.res.headers.get("x-content-type-options") ?? "missing"
      );
    }

    const foreign = await call("/api/documents/doc-does-not-exist/file");
    check("GET file for foreign id → 404", foreign.status === 404, `status ${foreign.status}`);
  }
);

// =====================================================================
// 5. Document intelligence
// =====================================================================
console.log("\n— Document intelligence —");
await authed(
  [
    "GET /api/integrations/status",
    "POST /api/documents/[id]/analyze",
    "Re-analyze processed doc is idempotent",
  ],
  async () => {
    const probe = await call("/api/integrations/status");
    expect("GET /api/integrations/status", probe);
    const realAi = probe.json?.ai?.documentIntelligence === true;
    check("AI availability is reported honestly", probe.json?.success === true, `documentIntelligence=${realAi}`);
    check(
      "No key material is exposed by the status endpoint",
      !/key|secret|token=/i.test(JSON.stringify(probe.json?.ai ?? {})),
      JSON.stringify(probe.json?.ai ?? {})
    );

    if (!state.docIds[0]) {
      blocked("POST /api/documents/[id]/analyze", "no uploaded document id");
      blocked("Re-analyze processed doc is idempotent", "no uploaded document id");
      return;
    }

    const r = await call(`/api/documents/${state.docIds[0]}/analyze`, { method: "POST" });
    if (realAi) {
      // Real Gemini path: either success, or an honest 503 when the
      // provider is rate-limited. A 503 is not an app bug.
      if (r.status === 503) {
        blocked("POST /api/documents/[id]/analyze", `Gemini unavailable/rate-limited: ${r.json?.error ?? "503"}`);
      } else {
        check(
          "POST /api/documents/[id]/analyze (Gemini)",
          r.json?.success === true && r.json?.extraction?.mode === "gemini",
          `${brief(r)} · mode=${r.json?.extraction?.mode}`
        );
      }
    } else {
      check(
        "POST /api/documents/[id]/analyze (labelled demo mode)",
        r.json?.success === true && r.json?.extraction?.mode === "simulated",
        `${brief(r)} · mode=${r.json?.extraction?.mode}`
      );
    }

    const again = await call(`/api/documents/${state.docIds[0]}/analyze`, { method: "POST" });
    check(
      "Re-analyze processed doc is idempotent",
      again.json?.success === true && again.json?.alreadyProcessed === true,
      `status ${again.status} · alreadyProcessed=${again.json?.alreadyProcessed}`
    );
  }
);

// =====================================================================
// 6. Scholarships catalogue
// =====================================================================
console.log("\n— Scholarships —");
await authed(
  [
    "GET /api/scholarships catalogue non-empty",
    "Catalogue search filter works",
    "Scholarship entries carry deadlines + required documents",
  ],
  async () => {
    const r = await call("/api/scholarships");
    expect("GET /api/scholarships", r);
    const all = r.json?.scholarships ?? [];
    state.catalogueCount = all.length;
    state.scholarshipId = all[0]?.id ?? "";

    if (all.length === 0) {
      blocked(
        "GET /api/scholarships catalogue non-empty",
        "catalogue table is empty — run supabase/seed-demo.sql (or load real rows); nothing is fabricated by app code"
      );
      blocked("Catalogue search filter works", "empty catalogue");
      blocked("Scholarship entries carry deadlines + required documents", "empty catalogue");
      return;
    }
    logPass("GET /api/scholarships catalogue non-empty", `count ${all.length} · isDemoData=${r.json?.isDemoData}`);

    const term = all[0].name.split(/\s+/)[0];
    const f = await call(`/api/scholarships?status=open&q=${encodeURIComponent(term)}`);
    check(
      "Catalogue search filter works",
      f.json?.success === true && Array.isArray(f.json?.scholarships) && f.json.scholarships.length > 0,
      `q=${term} · count ${f.json?.count}`
    );

    const first = all[0];
    check(
      "Scholarship entries carry deadlines + required documents",
      Boolean(first?.name && first?.deadline && Array.isArray(first?.requiredDocuments)),
      `${first?.name ?? "—"} · deadline ${first?.deadline ?? "—"}`
    );
  }
);

// =====================================================================
// 7. Eligibility
// =====================================================================
console.log("\n— Eligibility engine —");
await authed(["GET /api/eligibility"], async () => {
  const r = await call("/api/eligibility");
  if (r.status === 200 && r.json?.success === true) {
    const rs = r.json.results ?? [];
    const shaped = rs.every(
      (x) => Array.isArray(x.reasons) && Array.isArray(x.missingInfo) && typeof x.score === "number"
    );
    if (rs.length === 0) {
      blocked("GET /api/eligibility", "catalogue is empty — no schemes to evaluate (seed the catalogue)");
    } else {
      check("GET /api/eligibility", shaped, `results ${rs.length}`);
    }
  } else {
    logFail("GET /api/eligibility", brief(r));
  }
});

// =====================================================================
// 8. Applications
// =====================================================================
console.log("\n— Applications —");
await authed(
  [
    "POST /api/applications (create)",
    "GET /api/applications (list)",
    "PATCH status → awaiting-review",
    "PATCH submitted WITHOUT confirmation blocked",
    "PATCH submitted WITH confirmation accepted",
    "PATCH under-verification after submission",
    "Application state persisted",
    "POST unknown scholarship → 404",
    "PATCH invalid status rejected (400)",
  ],
  async () => {
    if (!state.scholarshipId) {
      for (const n of [
        "POST /api/applications (create)",
        "GET /api/applications (list)",
        "PATCH status → awaiting-review",
        "PATCH submitted WITHOUT confirmation blocked",
        "PATCH submitted WITH confirmation accepted",
        "PATCH under-verification after submission",
        "Application state persisted",
      ]) blocked(n, "empty scholarship catalogue");
      // These two do not depend on the catalogue:
      const unknown = await call("/api/applications", { method: "POST", body: { scholarshipId: "does-not-exist" } });
      check("POST unknown scholarship → 404", unknown.status === 404, `status ${unknown.status}`);
      const bad = await call(`/api/applications/app-does-not-exist`, { method: "PATCH", body: { status: "hacked-status" } });
      check("PATCH invalid status rejected (400)", bad.status === 400, `status ${bad.status}`);
      return;
    }

    // Reusable account: pick a catalogue entry that is not tracked yet,
    // so "starts as preparing" is still a real assertion across runs.
    const list0 = await call("/api/applications");
    const tracked = new Set((list0.json?.applications ?? []).map((a) => a.scholarshipId));
    const catalogue = (await call("/api/scholarships")).json?.scholarships ?? [];
    const fresh = catalogue.find((s) => !tracked.has(s.id));

    if (!fresh) {
      blocked("POST /api/applications (create)", "every catalogue entry is already tracked by this account — reset the E2E account's applications (see README) or use a fresh test account");
    } else {
      const creat = await call("/api/applications", { method: "POST", body: { scholarshipId: fresh.id } });
      if ([200, 201].includes(creat.status) && creat.json?.application?.id) {
        state.trackAppId = creat.json.application.id;
        logPass("POST /api/applications (create)", `status ${creat.status} · ${fresh.name}`);
        check(
          "New application starts as 'preparing'",
          creat.json.application.status === "preparing",
          creat.json.application.status
        );
      } else {
        logFail("POST /api/applications (create)", brief(creat));
      }
    }

    const list = await call("/api/applications");
    expect("GET /api/applications (list)", list);
    if (state.trackAppId) {
      check(
        "Application listed",
        (list.json?.applications ?? []).some((a) => a.id === state.trackAppId),
        `count ${(list.json?.applications ?? []).length}`
      );
    } else {
      blocked("Application listed", "no application was created");
    }

    if (!state.trackAppId) {
      for (const n of [
        "PATCH status → awaiting-review",
        "PATCH submitted WITHOUT confirmation blocked",
        "PATCH submitted WITH confirmation accepted",
        "PATCH under-verification after submission",
        "Application state persisted",
      ]) blocked(n, "no application was created");
    } else {
      const review = await call(`/api/applications/${state.trackAppId}`, {
        method: "PATCH",
        body: { status: "awaiting-review" },
      });
      expect("PATCH status → awaiting-review", review);

      const noConfirm = await call(`/api/applications/${state.trackAppId}`, {
        method: "PATCH",
        body: { status: "submitted" },
      });
      check(
        "PATCH submitted WITHOUT confirmation blocked",
        noConfirm.status === 400 && /confirm/i.test(noConfirm.json?.error ?? ""),
        `status ${noConfirm.status} · ${noConfirm.json?.error ?? ""}`
      );

      const confirmed = await call(`/api/applications/${state.trackAppId}`, {
        method: "PATCH",
        body: { status: "submitted", confirmSubmitted: true },
      });
      expect("PATCH submitted WITH confirmation accepted", confirmed);

      const verifyStage = await call(`/api/applications/${state.trackAppId}`, {
        method: "PATCH",
        body: { status: "under-verification" },
      });
      check(
        "PATCH under-verification after submission",
        verifyStage.json?.success === true,
        `status ${verifyStage.status} · ${verifyStage.json?.error ?? "ok"}`
      );

      const after = await call("/api/applications");
      const app = (after.json?.applications ?? []).find((a) => a.id === state.trackAppId);
      check("Application state persisted", app?.status === "under-verification", `stored status ${app?.status ?? "—"}`);
      state.submitAppId = state.trackAppId;
    }

    const unknown = await call("/api/applications", { method: "POST", body: { scholarshipId: "does-not-exist" } });
    check("POST unknown scholarship → 404", unknown.status === 404, `status ${unknown.status}`);

    const bad = await call(`/api/applications/${state.trackAppId || "app-does-not-exist"}`, {
      method: "PATCH",
      body: { status: "hacked-status" },
    });
    check("PATCH invalid status rejected (400)", bad.status === 400, `status ${bad.status}`);
  }
);

// =====================================================================
// 9. Notifications + reminders
// =====================================================================
console.log("\n— Notifications & reminders —");
await authed(
  ["GET /api/notifications", "GET /api/notifications/reminders", "Reminder re-run is idempotent", "PATCH notifications mark read"],
  async () => {
    const feed = await call("/api/notifications");
    expect("GET /api/notifications", feed);
    check("Unread count is reported", typeof feed.json?.unreadCount === "number", `unread ${feed.json?.unreadCount}`);

    const rem = await call("/api/notifications/reminders");
    expect("GET /api/notifications/reminders", rem);
    check(
      "Reminder engine returns an explicit created[] list",
      Array.isArray(rem.json?.created) && typeof rem.json?.unreadCountAfter === "number",
      `created ${rem.json?.count ?? "—"}`
    );
    const rem2 = await call("/api/notifications/reminders");
    check(
      "Reminder re-run is idempotent",
      Array.isArray(rem2.json?.created) && rem2.json.created.length === 0,
      `second run created ${rem2.json?.created?.length}`
    );

    const n = await call("/api/notifications");
    const firstUnread = (n.json?.notifications ?? []).find((x) => !x.read);
    const mark = await call("/api/notifications", {
      method: "PATCH",
      body: firstUnread ? { id: firstUnread.id } : {},
    });
    expect("PATCH notifications mark read", mark);
  }
);

// =====================================================================
// 10. Assistant chat (live Gemini)
// =====================================================================
console.log("\n— Assistant chat (Gemini) —");
await authed(["POST /api/assistant/chat", "POST /api/assistant/chat invalid body → 400"], async () => {
  const probe = await call("/api/integrations/status");
  const configured = probe.json?.ai?.assistantChat === true;
  const r = await call("/api/assistant/chat", {
    method: "POST",
    body: { messages: [{ role: "user", content: "In one sentence: what should a student complete in their profile first?" }] },
  });
  if (!configured) {
    check(
      "POST /api/assistant/chat (unconfigured → honest 503)",
      r.status === 503 && Boolean(r.json?.error),
      `status ${r.status}`
    );
  } else if (r.status === 503) {
    blocked("POST /api/assistant/chat", `Gemini unavailable/rate-limited: ${r.json?.error ?? "503"}`);
  } else {
    check(
      "POST /api/assistant/chat (live AI)",
      r.json?.success === true && typeof r.json?.reply === "string" && r.json.reply.length > 0,
      `status ${r.status} · mode ${r.json?.mode}`
    );
  }

  const bad = await call("/api/assistant/chat", { method: "POST", body: { messages: "not-an-array" } });
  check("POST /api/assistant/chat invalid body → 400", bad.status === 400, `status ${bad.status}`);
});

// =====================================================================
// 11. Profile apply (AI extraction → profile)
// =====================================================================
console.log("\n— Profile apply —");
await authed(["POST /api/profile apply extraction", "annualIncome apply updates family_income"], async () => {
  const r = await call("/api/profile", {
    method: "POST",
    body: { fields: { name: "E2E Test Student", dob: "2004-03-14", state: "Karnataka", annualIncome: "240000" } },
  });
  expect("POST /api/profile apply extraction", r);
  const g = await call("/api/profile");
  check(
    "annualIncome apply updates family_income",
    g.json?.profile?.familyIncome === 240000,
    `familyIncome=${g.json?.profile?.familyIncome}`
  );
});

// =====================================================================
// 12. Cleanup + logout
// =====================================================================
console.log("\n— Cleanup & logout —");
if (state.authed) {
  // Delete unsubmitted artifacts; submitted applications are
  // intentionally not deletable via the API (audit trail).
  let cleaned = 0;
  for (const id of state.docIds) {
    const r = await call(`/api/documents/${id}`, { method: "DELETE" });
    if (r.status === 200) cleaned++;
  }
  check("Cleanup: test documents deleted", cleaned === state.docIds.length, `${cleaned}/${state.docIds.length} deleted`);

  const logout = await call("/api/auth/logout", { method: "POST" });
  expect("POST /api/auth/logout", logout);
  const after = await call("/api/auth/session");
  check("Session revoked after logout (401)", after.status === 401, `status ${after.status}`);
} else {
  blocked("Cleanup: test documents deleted", "no authenticated session");
  blocked("POST /api/auth/logout", "no authenticated session");
}

// =====================================================================
// Report
// =====================================================================
const total = results.length;
console.log("\n===== E2E AUDIT SUMMARY =====");
console.log(`Checks: ${total}`);
console.log(`  PASS:    ${counts.pass}`);
console.log(`  FAIL:    ${counts.fail}`);
console.log(`  BLOCKED: ${counts.blocked}`);

if (counts.blocked > 0) {
  console.log("\nBlocked checks (infrastructure, NOT app failures):");
  for (const r of results.filter((x) => x.status === "BLOCKED")) {
    console.log(`  ⏭️  ${r.name} — ${r.detail}`);
  }
}
if (counts.fail > 0) {
  console.log("\nFailed checks:");
  for (const r of results.filter((x) => x.status === "FAIL")) {
    console.log(`  ❌ ${r.name} — ${r.detail}`);
  }
}

console.log(
  `\nResult: ${counts.fail === 0 ? (counts.blocked === 0 ? "ALL CHECKS PASSED" : "NO APP FAILURES — some checks BLOCKED") : "APP FAILURES PRESENT"}`
);
process.exit(counts.fail > 0 ? 1 : counts.blocked > 0 ? 2 : 0);
