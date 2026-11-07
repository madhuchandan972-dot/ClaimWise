// ============================================================
// ClaimWise — GET/PUT /api/profile
// Reads and updates the signed-in student's profile.
// Server-side session check + field validation + protected-field
// filtering. Only the owner can ever read or write.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  applyExtractionToProfile,
  computeProfileComplete,
  ELIGIBILITY_PROFILE_FIELDS,
  getWorkspace,
  saveProfile,
} from "@/lib/store";
import { EXTRACTABLE_PROFILE_FIELDS } from "@/lib/store";
import type { User } from "@/lib/types";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number.")
    .optional()
    .or(z.literal("")),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD date format.")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional().or(z.literal("")),
  state: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
  religion: z.string().trim().max(60).optional(),
  category: z.enum(["General", "SC", "ST", "OBC", "EWS"]).optional().or(z.literal("")),
  disability: z.boolean().optional(),
  familyIncome: z.number().int().min(0).max(100_000_000).optional(),
  college: z.string().trim().max(160).optional(),
  course: z.string().trim().max(120).optional(),
  year: z.string().trim().max(40).optional(),
  educationLevel: z.string().trim().max(60).optional(),
  marksPercentage: z.number().min(0).max(100).optional(),
  marksExam: z.string().trim().max(60).optional(),
});


function loadOrCreate(request: NextRequest) {
  return getSessionFromRequest(request);
}

// GET → current profile + completion metadata
export async function GET(request: NextRequest) {
  const session = await loadOrCreate(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const userData = await getWorkspace(session.sub, session.email, session.name);
  const profile = userData.profile;

  // Completion counts booleans/numbers too
  const fields: (keyof User)[] = [...ELIGIBILITY_PROFILE_FIELDS, "religion", "marksPercentage"];
  const filled = fields.filter((f) => {
    const v = profile[f];
    const empty = v === undefined || v === null || v === "" || v === 0 || v === false && f === "disability";
    return !empty;
  }).length;

  return NextResponse.json({
    success: true,
    profile,
    profileCompletion: Math.round((filled / fields.length) * 100),
    missingFields: fields.filter((f) => {
      const v = profile[f];
      return v === undefined || v === null || v === "" || v === 0;
    }),
    extractableFields: EXTRACTABLE_PROFILE_FIELDS,
  });
}

// PUT → update profile (whitelisted fields only)
export async function PUT(request: NextRequest) {
  const session = await loadOrCreate(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const userData = await getWorkspace(session.sub, session.email, session.name);

  try {
    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid profile data." },
        { status: 400 }
      );
    }

    // New accounts may rename themselves; demo profile is read-only identity
    const updates = { ...parsed.data } as Partial<User>;

    // Empty strings mean "field not provided" (e.g. a "Select…" dropdown left
    // unchosen) — treat them as no-change so the stored value is preserved
    // instead of writing an invalid empty enum/string into the profile.
    for (const key of Object.keys(updates) as (keyof typeof updates)[]) {
      if (typeof updates[key] === "string" && (updates[key] as string).trim() === "") {
        delete updates[key];
      }
    }

    if (session.demo && updates.name && updates.name !== userData.profile.name) {
      delete updates.name;
    }

    const profile = await saveProfile(session.sub, updates);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Workspace not initialised. Please sign in again." },
        { status: 404 }
      );
    }
    const complete = computeProfileComplete(profile);
    if (complete !== profile.profileComplete) {
      await saveProfile(session.sub, { profileComplete: complete });
    }

    return NextResponse.json({
      success: true,
      profile: { ...profile, profileComplete: complete },
      message: "Profile saved successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }
}

// POST → apply approved AI-extracted fields (separate, explicit flow)
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const { fields } = (await request.json().catch(() => ({}))) as {
    fields?: Record<string, string>;
  };
  if (!fields || typeof fields !== "object") {
    return NextResponse.json(
      { success: false, error: "No fields provided to apply." },
      { status: 400 }
    );
  }

  const result = await applyExtractionToProfile(session.sub, fields);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
