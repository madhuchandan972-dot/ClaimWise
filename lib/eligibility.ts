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

function matchesLevel(profile: User, level: string): boolean | null {
  if (!level) return null;
  const wanted = level.trim().toLowerCase();
  if (!wanted) return null;

  const declared = (profile.educationLevel ?? "").trim().toLowerCase();
  if (declared) {
    if (declared === wanted) return true;
    // Treat "UG"/"PG" shorthand as equivalent to the full label.
    const aliases: Record<string, string[]> = {
      undergraduate: ["ug", "undergraduate", "bachelor", "graduation"],
      postgraduate: ["pg", "postgraduate", "master", "masters"],
      diploma: ["diploma", "polytechnic"],
      "10th": ["10th", "sslc", "class 10", "secondary"],
      "12th": ["12th", "puc", "class 12", "higher secondary"],
      phd: ["phd", "doctorate", "doctoral"],
    };
    const group = aliases[wanted] ?? [wanted];
    if (group.some((g) => declared === g || declared.includes(g))) return true;
    return false;
  }

  // No explicit level saved — infer conservatively from the course name.
  const course = (profile.course ?? "").toLowerCase();
  if (!course) return null;
  const ug = ["b.tech", "b.e", "b.sc", "b.com", "b.a", "bca", "bba", "mbbs", "bachelor"];
  const pg = ["m.tech", "m.e", "m.sc", "m.com", "m.a", "mba", "mca", "postgrad", "master"];
  const looksUg = ug.some((k) => course.includes(k));
  const looksPg = pg.some((k) => course.includes(k));
  if (wanted === "undergraduate") return looksUg ? true : looksPg ? false : null;
  if (wanted === "postgraduate") return looksPg ? true : looksUg ? false : null;
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

  // ---- 3. Category ----
  const categories = (
    scholarship.categoryRequirements.length
      ? scholarship.categoryRequirements
      : (e.caste ?? [])
  ).filter(Boolean);
  if (categories.length > 0) {
    if (profile.category) {
      const normalized = categories.map((c) => String(c).trim().toLowerCase());
      if (normalized.includes(profile.category.toLowerCase())) {
        passed.push(
          `Your category (${LABELED_CATEGORIES[profile.category] ?? profile.category}) is eligible`
        );
      } else {
        failed.push(
          `This scholarship is limited to ${categories
            .map((c) => LABELED_CATEGORIES[c] ?? c)
            .join(", ")}; your category is ${LABELED_CATEGORIES[profile.category] ?? profile.category}`
        );
      }
    } else {
      missing.push("Add your social category to check this requirement");
    }
  }

  // ---- 4. State ----
  const states = (scholarship.states.length ? scholarship.states : e.state ?? []).filter(Boolean);
  if (states.length > 0) {
    if (profile.state) {
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
