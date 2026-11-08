// ============================================================
// ClaimWise — Scholarship Eligibility Engine
//
// A deterministic, explainable rule evaluation. It never invents a
// scholarship's criteria: it only compares the student's saved
// profile with the requirements stored in the catalogue.
//
// Outcomes:
//   eligible            — every checkable requirement passed
//   possibly-eligible   — some requirement(s) could not be checked
//   not-eligible        — a requirement definitively failed
//   more-info-required  — no requirement could be checked yet
// ============================================================

import type {
  User,
  Scholarship,
  Document,
  EligibilityResult,
  EligibilityStatus,
} from "./types";

const LABELED_CATEGORIES: Record<string, string> = {
  General: "General",
  SC: "Scheduled Caste (SC)",
  ST: "Scheduled Tribe (ST)",
  OBC: "Other Backward Class (OBC)",
  EWS: "Economically Weaker Section (EWS)",
};

export function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function documentLabel(type: string): string {
  const map: Record<string, string> = {
    AadhaarCard: "Aadhaar Card",
    PANCard: "PAN Card",
    PropertyDocument: "Property Document",
    InsuranceDocument: "Insurance Document",
    IncomeCertificate: "Income Certificate",
    CasteCertificate: "Caste Certificate",
    MarksCard: "Marks Card",
    TransferCertificate: "Transfer Certificate",
    BankDocument: "Bank Document",
    Other: "Other Document",
  };
  return map[type] ?? type;
}

function markPct(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null;
  const str = String(value).trim().replace("%", "");
  const n = Number(str);
  return Number.isFinite(n) && n > 0 && n <= 100 ? n : null;
}

/**
 * Normalise a criterion token: lowercase, brackets become spaces,
 * whitespace collapsed. Used for the admin-verified catalogue style
 * ("Class 11-12 / Undergraduate", "General / EWS", "All India", ...).
 */
function normToken(value: string): string {
  return String(value)
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split criterion cells like "Class 11-12 / Diploma / Undergraduate" into tokens. */
function criterionTokens(cells: readonly unknown[]): string[] {
  return cells
    .flatMap((v) => String(v).split("/"))
    .map(normToken)
    .filter(Boolean);
}

/** Demographic tokens we can evaluate against the profile. */
const CATEGORY_TOKEN_MAP: Record<string, string> = {
  general: "General",
  ews: "EWS",
  obc: "OBC",
  sc: "SC",
  st: "ST",
  pwd: "PwD",
  divyangjan: "PwD",
  disabled: "PwD",
  female: "Female",
  women: "Female",
  woman: "Female",
  girl: "Female",
  girls: "Female",
};

/** States cells that mean "open to every Indian state". */
const ALL_INDIA_RE = /^(all india|all-india|india wide|nationwide|all states)$/;

/** Canonical education levels → their accepted spellings on the requirement side. */
const LEVEL_GROUP: Record<string, string[]> = {
  undergraduate: ["ug", "undergraduate", "bachelor", "graduation"],
  postgraduate: ["pg", "postgraduate", "master", "masters"],
  diploma: ["diploma", "iti", "polytechnic"],
  "10th": ["10th", "sslc", "class 10", "secondary"],
  "12th": ["12th", "puc", "class 12", "higher secondary"],
  phd: ["phd", "doctorate", "doctoral"],
};

/**
 * Does a single education-level TOKEN admit this declared level?
 * Returns null when the token is descriptive (not a level we can check).
 * Handles school-stage ranges: "class 11-12" admits a declared "12th".
 */
function levelTokenAdmits(token: string, declared: string): boolean | null {
  if (!token || !declared) return null;

  const classMatch = token.match(/^class\s*(\d+)\s*(?:-|–|to)\s*(\d+)$/);
  const singleClass = token.match(/^class\s*(\d+)$/);
  if (classMatch ?? singleClass) {
    const low = Number((classMatch ?? singleClass)![1]);
    const high = classMatch ? Number(classMatch[2]) : low;
    const declaredNum = declared === "10th" ? 10 : declared === "12th" ? 12 : null;
    if (declaredNum === null) return null;
    return declaredNum >= low && declaredNum <= high;
  }

  const canonical = LEVEL_GROUP[token];
  if (canonical) return canonical.includes(declared);
  return null; // descriptive token ("exam preparation", "athlete", …)
}

function matchesLevel(profile: User, level: string): boolean | null {
  const tokens = criterionTokens([level]);
  if (!tokens.length) return null;

  const declared = (profile.educationLevel ?? "").trim().toLowerCase();
  if (declared) {
    let unknownOnly = true;
    for (const token of tokens) {
      const verdict = levelTokenAdmits(token, declared);
      if (verdict === true) return true;
      if (verdict === false) unknownOnly = false;
    }
    return unknownOnly ? null : false;
  }

  // No explicit level saved — infer conservatively from the course name.
  const course = (profile.course ?? "").toLowerCase();
  if (!course) return null;
  const ug = ["b.tech", "b.e", "b.sc", "b.com", "b.a", "bca", "bba", "mbbs", "bachelor"];
  const pg = ["m.tech", "m.e", "m.sc", "m.com", "m.a", "mba", "mca", "postgrad", "master"];
  const looksUg = ug.some((k) => course.includes(k));
  const looksPg = pg.some((k) => course.includes(k));
  const wantsUg = tokens.some((t) => ["ug", "undergraduate", "bachelor", "graduation"].includes(t));
  const wantsPg = tokens.some((t) => ["pg", "postgraduate", "master", "masters"].includes(t));
  if (wantsUg) return looksUg ? true : looksPg ? false : null;
  if (wantsPg) return looksPg ? true : looksUg ? false : null;
  return null;
}

export function computeEligibility(
  profile: User,
  scholarship: Scholarship,
  documents: Document[] = []
): EligibilityResult {
  const passed: string[] = [];
  const failed: string[] = [];
  const missing: string[] = [];
  const e = scholarship.eligibility ?? {};

  // ---- 1. Annual family income ----
  const maxIncome = scholarship.maxIncome ?? e.maxIncome;
  if (maxIncome !== undefined && maxIncome !== null) {
    if (profile.familyIncome > 0) {
      if (profile.familyIncome <= maxIncome) {
        passed.push(
          `Family income (${formatINR(profile.familyIncome)}) is within the ${formatINR(maxIncome)} limit`
        );
      } else {
        failed.push(
          `Family income (${formatINR(profile.familyIncome)}) exceeds the ${formatINR(maxIncome)} limit`
        );
      }
    } else {
      missing.push(
        `Add your annual family income to check the ${formatINR(maxIncome)} income limit`
      );
    }
  }

  // ---- 2. Minimum marks ----
  if (e.minMarks !== undefined) {
    const pct = markPct(profile.marksPercentage);
    if (pct !== null) {
      if (pct >= e.minMarks) {
        passed.push(`Your marks (${pct}%) meet the minimum ${e.minMarks}% requirement`);
      } else {
        failed.push(`Your marks (${pct}%) are below the minimum ${e.minMarks}% required`);
      }
    } else {
      missing.push(`Add your last exam marks to check the ${e.minMarks}% minimum`);
    }
  }

  // ---- 3. Category & demographic gates (category_requirements tokens) ----
  const categoryCells = (
    scholarship.categoryRequirements.length
      ? scholarship.categoryRequirements
      : (e.caste ?? [])
  ).filter(Boolean);

  // Classify every token. Tokens we cannot map ("Merit", "Central
  // Government", "Private CSR"...) are informational and never failed on.
  const demoTokens: string[] = [];
  for (const cell of categoryCells) {
    for (const token of criterionTokens([cell])) {
      const mapped = CATEGORY_TOKEN_MAP[token];
      if (mapped) demoTokens.push(mapped);
    }
  }

  if (demoTokens.length > 0) {
    const casteSet = new Set(demoTokens.filter((t) => ["General", "EWS", "OBC", "SC", "ST"].includes(t)));
    const wantsFemale = demoTokens.includes("Female");
    const wantsPwd = demoTokens.includes("PwD");

    let anyMissing = false;
    const passLabels: string[] = [];

    if (casteSet.size > 0) {
      if (profile.category) {
        if (casteSet.has(profile.category)) {
          passLabels.push(`your category (${LABELED_CATEGORIES[profile.category] ?? profile.category}) is accepted`);
        } else {
          failed.push(
            `This scholarship is limited to: ${[...casteSet]
              .map((c) => LABELED_CATEGORIES[c] ?? c)
              .join(", ")} — your category is ${LABELED_CATEGORIES[profile.category] ?? profile.category}`
          );
        }
      } else {
        anyMissing = true;
        missing.push("Add your social category to check this requirement");
      }
    }

    if (wantsFemale) {
      if (profile.gender === "Female") {
        passLabels.push("open to girl students");
      } else if (profile.gender === "Male") {
        failed.push("This scholarship is only for girl students");
      } else {
        anyMissing = true;
        missing.push("Confirm your gender to check the girl-student requirement");
      }
    }

    if (wantsPwd) {
      if (profile.disability) {
        passLabels.push("a valid disability certificate / UDID will be required at application");
      } else {
        failed.push(
          "This scheme is reserved for students with a benchmark disability (valid disability certificate / UDID)"
        );
      }
    }

    if (!failed.length && !anyMissing) {
      passed.push(`Category check passed: ${passLabels.join("; ")}`);
    }
  }

  // ---- 4. State ----
  const states = (scholarship.states.length ? scholarship.states : e.state ?? []).filter(Boolean);
  if (states.length > 0) {
    if (states.some((s) => ALL_INDIA_RE.test(String(s).trim()))) {
      passed.push("Open to students from all Indian states");
    } else if (profile.state) {
      if (states.some((s) => s.toLowerCase() === profile.state.toLowerCase())) {
        passed.push(`Your state (${profile.state}) is eligible`);
      } else {
        failed.push(
          `This scholarship is for students of ${states.join(", ")}; your state is ${profile.state}`
        );
      }
    } else {
      missing.push("Add your home state to check the domicile requirement");
    }
  }

  // ---- 5. Gender ----
  if (e.gender && e.gender.length > 0) {
    if (profile.gender) {
      if (e.gender.includes(profile.gender)) {
        passed.push(`This scholarship is open to your gender (${profile.gender})`);
      } else {
        failed.push(`This scholarship is only for ${e.gender.join("/")} students`);
      }
    } else {
      missing.push("Add your gender to check this requirement");
    }
  }

  // ---- 6. Education level ----
  const level = scholarship.educationLevel || e.educationLevel || "";
  if (level) {
    const result = matchesLevel(profile, level);
    if (result === true) {
      passed.push(
        `Your education level (${profile.educationLevel || profile.course || level}) matches ${level}`
      );
    } else if (result === false) {
      failed.push(
        `This scholarship requires ${level}; your education level is ${profile.educationLevel || profile.course || "not set"}`
      );
    } else {
      missing.push(
        `Select your education level to check the ${level} requirement`
      );
    }
  }

  // ---- 7. Eligible courses ----
  const courses = scholarship.courses.filter(Boolean);
  if (courses.length > 0) {
    const anyStream = courses.some((c) =>
      /^(any stream|any|all streams|any discipline|any degree|any course|any stream$)/i.test(
        String(c).trim()
      )
    );
    if (anyStream) {
      // Course unrestricted; level is checked separately in step 6.
      passed.push("Open to all streams of study (education level checked separately)");
    } else {
      const mine = (profile.course ?? "").trim().toLowerCase();
      if (mine) {
        const courseMatch = courses.some((c) => {
          const wanted = c.toLowerCase();
          return mine.includes(wanted) || wanted.includes(mine);
        });
        if (courseMatch) {
          passed.push(`Your course (${profile.course}) is listed as eligible`);
        } else {
          failed.push(
            `This scholarship lists eligible courses: ${courses.join(", ")}; your course is ${profile.course}`
          );
        }
      } else {
        missing.push("Add your course to check the eligible-course requirement");
      }
    }
  }

  // ---- 8. Published free-text requirements (cannot be auto-checked) ----
  for (const requirement of e.extraRequirements ?? []) {
    if (requirement && requirement.trim()) {
      missing.push(`Confirm on the official portal: ${requirement}`);
    }
  }

  // ---- 9. Required documents ----
  const ownedTypes = new Set<string>(documents.map((d) => d.type));
  const missingDocuments = scholarship.requiredDocuments.filter(
    (t) => t !== "Other" && !ownedTypes.has(t)
  );
  for (const t of missingDocuments) {
    missing.push(`${documentLabel(t)} is missing from your Document Vault`);
  }

  const checkable = passed.length + failed.length;
  let status: EligibilityStatus;
  if (failed.length > 0) {
    status = "not-eligible";
  } else if (checkable === 0) {
    status = "more-info-required";
  } else if (missing.length > 0) {
    status = "possibly-eligible";
  } else {
    status = "eligible";
  }

  const reasons = [...failed, ...passed];
  const score =
    checkable === 0 ? 0 : Math.round((passed.length / checkable) * 100);

  return {
    scholarshipId: scholarship.id,
    scholarshipName: scholarship.name,
    status,
    score,
    reasons,
    missingInfo: missing,
    requiredDocuments: scholarship.requiredDocuments,
  };
}

export function computeAllEligibility(
  profile: User,
  scholarships: Scholarship[],
  documents: Document[] = []
): EligibilityResult[] {
  const order: Record<EligibilityStatus, number> = {
    eligible: 0,
    "possibly-eligible": 1,
    "more-info-required": 2,
    "not-eligible": 3,
  };
  return scholarships
    .map((s) => computeEligibility(profile, s, documents))
    .sort((a, b) => order[a.status] - order[b.status] || b.score - a.score);
}
