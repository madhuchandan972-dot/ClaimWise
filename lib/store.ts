// ============================================================
// ClaimWise Platform — User Workspace Data Layer (Supabase)
//
// Production implementation of the documented upgrade path: the
// in-process Maps are gone. All data lives in Postgres (profiles,
// documents, applications, notifications, scholarships) and file
// bytes in the PRIVATE Supabase Storage bucket `documents`.
//
// Call sites kept the same names; the functions are now async.
//
// Security properties that apply and MUST be preserved:
//   ✅ Every accessor is scoped by userId, verified server-side
//      (RLS policies enforce auth.uid()=user_id as a second layer)
//   ✅ Uploaded files are never exposed under a public URL — they
//      are streamed inline through an authorisation-checked route
//   ✅ File type/size validation happens on the server
//   ✅ New accounts are created BLANK — no sample/fictional records
//      are ever seeded automatically (the optional demo seed is a
//      manually-run script for the flagged demo account only)
// ============================================================

import type {
  User,
  Document,
  DocumentFileType,
  Scholarship,
  Application,
  Notification,
  ApplicationStatus,
} from "./types";
import { createSupabaseServerClient } from "./supabase/server";
import type { SupabaseServerClient } from "./supabase/server";

// ----------------------------------------------------------------
// Shared constants (unchanged contracts)
// ----------------------------------------------------------------

export const ALLOWED_MIME_TYPES: Record<string, DocumentFileType> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/png": "png",
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const EXTRACTABLE_PROFILE_FIELDS = [
  "name",
  "dob",
  "gender",
  "state",
  "category",
  "annualIncome",
] as const;

/** Supabase Storage bucket — private, access via RLS-style policies. */
const DOCUMENTS_BUCKET = "documents";

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

type Db = SupabaseServerClient;

interface Workspace {
  userId: string;
  profile: User;
  documents: Document[];
  applications: Application[];
  notifications: Notification[];
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Wraps a DB failure in an actionable message (never leaks internals). */
function dbError(operation: string, error: { message: string }): {
  message: string;
} {
  const m = error.message.toLowerCase();
  if (
    m.includes("relation") ||
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    m.includes("schema")
  ) {
    console.error(`[store:${operation}] DB error:`, error.message);
    return {
      message:
        "The database schema is not initialised yet. Run supabase/migrations/001_claimwise_init.sql in the Supabase SQL editor.",
    };
  }
  console.error(`[store:${operation}] DB error:`, error.message);
  return { message: "A database error occurred. Please try again." };
}

// ----------------------------------------------------------------
// Profile row mapping
// ----------------------------------------------------------------

type ProfileRow = {
  id: string;
  email: string | null;
  name: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  state: string | null;
  district: string | null;
  religion: string | null;
  category: string | null;
  disability: boolean | null;
  family_income: number | null;
  college: string | null;
  course: string | null;
  year: string | null;
  education_level: string | null;
  marks_percentage: number | null;
  marks_exam: string | null;
  profile_complete: boolean | null;
  is_demo: boolean | null;
  created_at: string;
  updated_at: string;
};

function rowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email ?? "",
    name: row.name,
    phone: row.phone ?? "",
    dob: row.dob ?? "",
    gender: (row.gender ?? "") as User["gender"],
    state: row.state ?? "",
    district: row.district ?? "",
    religion: row.religion ?? "",
    category: (row.category ?? "") as User["category"],
    disability: row.disability ?? false,
    familyIncome: row.family_income ?? 0,
    college: row.college ?? "",
    course: row.course ?? "",
    year: row.year ?? "",
    educationLevel: row.education_level ?? "",
    marksPercentage: row.marks_percentage ?? undefined,
    marksExam: row.marks_exam ?? "",
    profileComplete: row.profile_complete ?? false,
    isDemo: row.is_demo ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as unknown as User;
}

/**
 * Blank profile for a new account. Every identity field starts
 * empty so nothing the student did not provide themselves is
 * ever shown or stored.
 */
function blankProfileRow(
  userId: string,
  email: string,
  name: string,
  now: string
): ProfileRow {
  return {
    id: userId,
    email,
    name: name || "Student",
    phone: "",
    dob: "",
    gender: "",
    state: "",
    district: "",
    religion: "",
    category: "",
    disability: false,
    family_income: 0,
    college: "",
    course: "",
    year: "",
    education_level: "",
    marks_percentage: null,
    marks_exam: "",
    profile_complete: false,
    is_demo: false,
    created_at: now,
    updated_at: now,
  };
}

// ----------------------------------------------------------------
// Workspace bootstrap — creates a BLANK profile row when missing.
// Never seeds sample documents/applications/notifications.
// ----------------------------------------------------------------

async function ensureProfile(
  supabase: Db,
  userId: string,
  email: string,
  name: string
): Promise<User> {
  const { data: row, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw dbError("ensureProfile", error);
  if (row) return rowToUser(row as ProfileRow);

  const now = new Date().toISOString();
  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .upsert(blankProfileRow(userId, email, name, now))
    .select("*")
    .single();

  if (insertError) throw dbError("ensureProfile", insertError);
  return rowToUser(inserted as ProfileRow);
}

/**
 * Returns the user's workspace (profile + documents + applications
 * + notifications), creating a BLANK profile on first access.
 */
export async function getWorkspace(
  userId: string,
  email: string,
  name: string
): Promise<Workspace> {
  const supabase = await createSupabaseServerClient();
  const profile = await ensureProfile(supabase, userId, email, name);

  const [documents, applications, notifications] = await Promise.all([
    supabase.from("documents").select("*").eq("user_id", userId).order("uploaded_at", { ascending: false }),
    supabase.from("applications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  return {
    userId,
    profile,
    documents: (documents.data ?? []).map(rowToDocument),
    applications: (applications.data ?? []).map(rowToApplication),
    notifications: (notifications.data ?? []).map(rowToNotification),
  };
}

// ----------------------------------------------------------------
// Profile
// ----------------------------------------------------------------

export async function getProfile(userId: string): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw dbError("getProfile", error);
  return data ? rowToUser(data as ProfileRow) : null;
}

export async function getWorkspaceStrict(
  userId: string,
  email: string,
  name: string
): Promise<Workspace> {
  return getWorkspace(userId, email, name);
}

/** camelCase field → snake_case column (whitelisted mapping only). */
const PROFILE_FIELD_MAP: Record<string, string> = {
  name: "name",
  phone: "phone",
  dob: "dob",
  gender: "gender",
  state: "state",
  district: "district",
  religion: "religion",
  category: "category",
  disability: "disability",
  familyIncome: "family_income",
  college: "college",
  course: "course",
  year: "year",
  educationLevel: "education_level",
  marksPercentage: "marks_percentage",
  marksExam: "marks_exam",
  profileComplete: "profile_complete",
};

export async function saveProfile(
  userId: string,
  updates: Partial<User>
): Promise<User | null> {
  const supabase = await createSupabaseServerClient();

  const protectedFields: (keyof User)[] = ["id", "email", "createdAt"];
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (protectedFields.includes(key as keyof User)) continue;
    const column = PROFILE_FIELD_MAP[key];
    if (!column) continue;
    patch[column] = value === undefined ? null : value;
  }
  if (Object.keys(patch).length === 0) {
    const existing = await getProfile(userId);
    return existing;
  }

  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw dbError("saveProfile", error);
  return data ? rowToUser(data as ProfileRow) : null;
}

// ----------------------------------------------------------------
// Documents + private file store
// ----------------------------------------------------------------

type DocRow = {
  id: string;
  user_id: string;
  name: string;
  type: Document["type"];
  file_type: string;
  size: number;
  uploaded_at: string;
  status: Document["status"];
  // description / original_name are added in migration 003; older rows
  // fall back to empty strings in rowToDocument.
  description: string | null;
  original_name: string | null;
  extracted_data: Record<string, string> | null;
  extraction_mode: Document["extractionMode"] | null;
  reviewed: boolean | null;
};

function rowToDocument(row: DocRow): Document {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    fileType: (row.file_type ?? "pdf") as DocumentFileType,
    size: Number(row.size ?? 0),
    uploadedAt: row.uploaded_at,
    status: row.status,
    description: row.description ?? "",
    originalName: row.original_name ?? "",
    extractedData: row.extracted_data ?? undefined,
    extractionMode: row.extraction_mode ?? undefined,
    reviewed: row.reviewed ?? undefined,
  };
}

export async function listDocuments(userId: string): Promise<Document[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });
  if (error) throw dbError("listDocuments", error);
  return (data ?? []).map((row) => rowToDocument(row as DocRow));
}

export async function getDocument(
  docId: string,
  userId: string
): Promise<Document | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", docId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw dbError("getDocument", error);
  return data ? rowToDocument(data as DocRow) : null;
}

/** Reads a document by id only — RLS allows the owner OR an accepted family member. */
export async function getDocumentForViewer(
  docId: string
): Promise<Document | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", docId)
    .maybeSingle();
  if (error) throw dbError("getDocumentForViewer", error);
  return data ? rowToDocument(data as DocRow) : null;
}

/**
 * Magic-number sniffing. The declared Content-Type is deliberately NOT
 * trusted: a file is only accepted when its actual bytes carry a valid
 * PDF / JPEG / PNG signature. Anything else is rejected, so a renamed
 * or disguised upload can never reach storage.
 */
function detectMimeType(buf: Buffer): string | null {
  if (buf.length >= 4) {
    if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf"; // %PDF
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf.length >= 3 && buf[2] === 0xff) return "image/jpeg"; // JPEG SOI + marker
    if (
      buf.length >= 8 &&
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
      buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
    ) {
      return "image/png"; // full PNG signature
    }
  }
  return null;
}

export type AddDocumentResult =
  | { success: true; document: Document }
  | { success: false; error: string };

export async function addDocument(
  userId: string,
  name: string,
  size: number,
  type: Document["type"],
  fileBuffer: Buffer,
  options: { description?: string; originalName?: string } = {}
): Promise<AddDocumentResult> {
  const supabase = await createSupabaseServerClient();

  if (size > MAX_FILE_SIZE) {
    return { success: false, error: "File is too large. Maximum allowed size is 5 MB." };
  }

  // Validate actual bytes, not the declared type (prevents disguised uploads)
  const sniffed = detectMimeType(fileBuffer);
  if (!sniffed || !ALLOWED_MIME_TYPES[sniffed]) {
    return {
      success: false,
      error: "Unsupported file type. Only PDF, JPG and PNG files are allowed.",
    };
  }
  const mimeType = sniffed;

  const ext = ALLOWED_MIME_TYPES[mimeType];
  const docId = `doc-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("documents")
    .insert({
      id: docId,
      user_id: userId,
      name: name.trim(),
      type,
      file_type: ext,
      size,
      uploaded_at: now,
      status: "pending",
      description: (options.description ?? "").slice(0, 1000),
      original_name: (options.originalName ?? name).slice(0, 255),
    })
    .select("*")
    .single();

  if (error) {
    const e = dbError("addDocument", error);
    return { success: false, error: e.message };
  }

  // Bytes go to the PRIVATE storage bucket keyed by owner — same
  // "no public URLs" guarantee as before.
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(`${userId}/${docId}`, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    // Roll back the metadata row so no orphaned record persists.
    await supabase.from("documents").delete().eq("id", docId).eq("user_id", userId);
    const e = dbError("addDocument.upload", uploadError);
    return { success: false, error: e.message };
  }

  return { success: true, document: rowToDocument(data as DocRow) };
}

/** Uploaded file bytes, resolved from private storage — never public. */
export interface StoredFile {
  userId: string;
  name: string;
  mimeType: string;
  data: Buffer;
}

/** Only the owning user may retrieve file bytes. Returns null otherwise. */
export async function getFile(
  docId: string,
  userId: string
): Promise<StoredFile | null> {
  const supabase = await createSupabaseServerClient();

  const doc = await getDocument(docId, userId);
  if (!doc) return null;

  const { data: blob, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(`${userId}/${docId}`);

  if (error || !blob) {
    // Sample/demo documents have no real file bytes — that stays true.
    console.error(
      "[getFile] download failed:",
      error?.message ?? "no blob"
    );
    return null;
  }

  return {
    userId,
    name: doc.name,
    mimeType: mimeForFileType(doc.fileType),
    data: Buffer.from(await blob.arrayBuffer()),
  };
}

/**
 * Resolves the bytes for a document the viewer may read.
 * Used by /api/documents/[id]/file: RLS returns the row only for the
 * owner or an accepted family member, and the storage read policy
 * grants exactly the same people access to the private object.
 */
export async function getFileForViewer(
  docId: string
): Promise<StoredFile | null> {
  const supabase = await createSupabaseServerClient();
  const doc = await getDocumentForViewer(docId);
  if (!doc) return null;

  const { data: blob, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(`${doc.userId}/${doc.id}`);

  if (error || !blob) {
    console.error("[getFileForViewer] download failed:", error?.message ?? "no blob");
    return null;
  }

  return {
    userId: doc.userId,
    name: doc.name,
    mimeType: mimeForFileType(doc.fileType),
    data: Buffer.from(await blob.arrayBuffer()),
  };
}

function mimeForFileType(fileType: DocumentFileType): string {
  switch (fileType) {
    case "pdf": return "application/pdf";
    case "png": return "image/png";
    case "jpg":
    case "jpeg":
    default: return "image/jpeg";
  }
}

export async function deleteDocument(
  docId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const doc = await getDocument(docId, userId);
  if (!doc) return false;

  // Drop the binary first so nothing orphaned stays in storage.
  const { error: storageError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove([`${userId}/${docId}`]);
  if (storageError) {
    console.error("[deleteDocument] storage remove failed:", storageError.message);
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", docId)
    .eq("user_id", userId);
  if (error) {
    console.error("[deleteDocument] delete failed:", error.message);
    return false;
  }
  return true;
}

export async function updateDocument(
  docId: string,
  userId: string,
  updates: Partial<Document>
): Promise<Document | null> {
  const supabase = await createSupabaseServerClient();

  const patch: Record<string, unknown> = {};
  if (updates.type !== undefined) patch.type = updates.type;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.extractedData !== undefined) patch.extracted_data = updates.extractedData;
  if (updates.extractionMode !== undefined) patch.extraction_mode = updates.extractionMode;
  if (updates.reviewed !== undefined) patch.reviewed = updates.reviewed;
  if (updates.name !== undefined) patch.name = updates.name;

  if (Object.keys(patch).length === 0) return getDocument(docId, userId);

  const { data, error } = await supabase
    .from("documents")
    .update(patch)
    .eq("id", docId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw dbError("updateDocument", error);
  return data ? rowToDocument(data as DocRow) : null;
}

export function cleanupExpiredFiles(): void {
  // Storage lifecycle rules handle TTL cleanup server-side; the row
  // and the bucket share the lifecycle. Intentional no-op, as before.
}

// ----------------------------------------------------------------
// Scholarships (read-only catalogue in public.scholarships)
// ----------------------------------------------------------------

type ScholarshipRow = {
  id: string;
  name: string;
  provider: string;
  amount: string;
  category: string[] | null;
  eligibility: Scholarship["eligibility"] | null;
  deadline: string;
  open_date: string | null;
  status: ScholarshipStatusRow;
  description: string;
  required_documents: string[] | null;
  official_link: string | null;
  is_demo: boolean | null;
  source: string | null;
  last_checked_at: string | null;
  state: string[] | null;
  education_level: string | null;
  course: string[] | null;
  category_requirements: string[] | null;
  family_income_criteria: string | null;
  max_income: number | null;
  scholarship_type: string | null;
  application_instructions: string | null;
  source_url: string | null;
  verification_status: Scholarship["verificationStatus"] | null;
  last_verified_at: string | null;
};

type ScholarshipStatusRow = Scholarship["status"];

function rowToScholarship(row: ScholarshipRow): Scholarship {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    amount: row.amount,
    category: row.category ?? [],
    eligibility: row.eligibility ?? {},
    deadline: row.deadline,
    openDate: row.open_date ?? row.deadline,
    status: row.status,
    description: row.description,
    requiredDocuments: row.required_documents ?? [],
    officialLink:
      row.official_link && row.official_link !== "#"
        ? row.official_link
        : row.source_url || "",
    officialUrl:
      row.official_link && row.official_link !== "#"
        ? row.official_link
        : row.source_url || "",
    sourceUrl: row.source_url ?? "",
    verificationStatus:
      row.verification_status === "verified" ? "verified" : "needs_verification",
    lastVerifiedAt:
      row.last_verified_at ?? row.last_checked_at ?? undefined,
    applicationInstructions: row.application_instructions ?? "",
    scholarshipType: row.scholarship_type ?? "",
    familyIncomeCriteria: row.family_income_criteria ?? "",
    maxIncome:
      row.max_income ?? row.eligibility?.maxIncome ?? undefined,
    states:
      row.state && row.state.length ? row.state : row.eligibility?.state ?? [],
    educationLevel:
      row.education_level || row.eligibility?.educationLevel || "",
    courses: row.course ?? [],
    categoryRequirements:
      row.category_requirements && row.category_requirements.length
        ? row.category_requirements
        : row.eligibility?.caste ?? [],
    isDemo: row.is_demo ?? false,
    source: row.source ?? undefined,
    lastCheckedAt: row.last_checked_at ?? undefined,
  };
}

export async function listScholarships(): Promise<Scholarship[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("scholarships")
    .select("*")
    .order("deadline", { ascending: true });
  if (error) throw dbError("listScholarships", error);
  return (data ?? []).map((row) => rowToScholarship(row as ScholarshipRow));
}

export async function getScholarship(
  scholarshipId: string
): Promise<Scholarship | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("scholarships")
    .select("*")
    .eq("id", scholarshipId)
    .maybeSingle();
  if (error) throw dbError("getScholarship", error);
  return data ? rowToScholarship(data as ScholarshipRow) : null;
}

/**
 * Upserts live catalogue entries through the SECURITY DEFINER
 * function from migration 004. RLS stays read-only for the table;
 * this is the only sanctioned write path.
 */
export async function upsertLiveScholarships(items: unknown[]): Promise<number> {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("upsert_live_scholarships", {
    p_items: items,
  });
  if (error) throw dbError("upsertLiveScholarships", error);
  return typeof data === "number" ? data : 0;
}

// ----------------------------------------------------------------
// Applications
// ----------------------------------------------------------------

type ApplicationRow = {
  id: string;
  user_id: string;
  scholarship_id: string;
  scholarship_name: string;
  status: ApplicationStatus;
  applied_date: string | null;
  notes: string | null;
  documents: string[] | null;
  next_action: string | null;
  timeline: Application["timeline"] | null;
  created_at: string;
};

function rowToApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    userId: row.user_id,
    scholarshipId: row.scholarship_id,
    scholarshipName: row.scholarship_name,
    status: row.status,
    appliedDate: row.applied_date ?? undefined,
    notes: row.notes ?? "",
    documents: row.documents ?? [],
    nextAction: row.next_action ?? "",
    timeline: row.timeline ?? [],
  };
}

export async function listApplications(userId: string): Promise<Application[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw dbError("listApplications", error);
  return (data ?? []).map((row) => rowToApplication(row as ApplicationRow));
}

export async function getApplication(
  appId: string,
  userId: string
): Promise<Application | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", appId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw dbError("getApplication", error);
  return data ? rowToApplication(data as ApplicationRow) : null;
}

export async function createApplication(
  userId: string,
  scholarship: Scholarship
): Promise<Application | null> {
  const supabase = await createSupabaseServerClient();

  const { data: existingRows, error: findError } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .eq("scholarship_id", scholarship.id)
    .maybeSingle();
  if (findError) throw dbError("createApplication", findError);
  if (existingRows) return rowToApplication(existingRows as ApplicationRow);

  const now = new Date().toISOString();
  const app = {
    id: `app-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    user_id: userId,
    scholarship_id: scholarship.id,
    scholarship_name: scholarship.name,
    status: "preparing" as ApplicationStatus,
    notes: "",
    documents: [] as string[],
    next_action: "Review eligibility report, then attach the required documents.",
    timeline: [
      { date: now, action: "Application created on ClaimWise", status: "completed" },
      { date: now, action: "Attach required documents", status: "current" },
      {
        date: scholarship.deadline,
        action: `Submit before deadline (${new Date(scholarship.deadline).toLocaleDateString("en-IN")})`,
        status: "pending",
      },
    ],
    created_at: now,
  };

  const { data, error } = await supabase
    .from("applications")
    .insert(app)
    .select("*")
    .single();

  if (error) throw dbError("createApplication", error);
  return rowToApplication(data as ApplicationRow);
}

/** Statuses the student may move an application into manually. */
const MANUAL_STATUSES: ApplicationStatus[] = [
  "awaiting-review",
  "ready-to-submit",
  "preparing",
];

/** Statuses that mean "the submission / outcome has been recorded". */
const POST_SUBMISSION_STATUSES: ApplicationStatus[] = [
  "submitted",
  "under-verification",
  "approved",
  "rejected",
  "more-info-required",
];

export async function updateApplicationStatus(
  appId: string,
  userId: string,
  status: ApplicationStatus,
  opts: { notes?: string; nextAction?: string; confirmSubmitted?: boolean }
): Promise<{ success: boolean; error?: string; application?: Application }> {
  const app = await getApplication(appId, userId);
  if (!app) return { success: false, error: "Application not found." };

  const isPostSubmission = POST_SUBMISSION_STATUSES.includes(status);
  const alreadyPostSubmission = POST_SUBMISSION_STATUSES.includes(app.status);

  // Never record "submitted / approved / rejected / verification /
  // more-info" for the FIRST time without explicit student
  // confirmation from the assistant-backed or tracker flow. Once the
  // submission is confirmed, plain tracker updates (e.g. "Under
  // Verification") are allowed without re-confirmation.
  if (isPostSubmission && !alreadyPostSubmission && !opts.confirmSubmitted) {
    return {
      success: false,
      error:
        "Confirmation required: an application can only be recorded as submitted (or given its portal outcome) after you explicitly confirm it.",
    };
  }

  if (!isPostSubmission && !MANUAL_STATUSES.includes(status)) {
    return { success: false, error: "Unsupported status change." };
  }

  const patch: Record<string, unknown> = { status };
  if (opts.notes !== undefined) patch.notes = opts.notes;
  if (opts.nextAction !== undefined) patch.next_action = opts.nextAction;

  if (status === "submitted") {
    patch.applied_date = new Date().toISOString();
    // Keep "next step" grounded in the new reality of a submitted app.
    if (opts.nextAction === undefined) {
      patch.next_action =
        "Submitted. Awaiting verification — check My Applications for portal updates.";
    }
  }

  const timeline: Application["timeline"] = [
    ...(app.timeline ?? []),
    {
      date: new Date().toISOString(),
      action:
        status === "submitted"
          ? "Student confirmed submission on the scholarship portal"
          : `Status updated to ${statusLabel(status)} by student`,
      status: "completed",
    },
  ];
  patch.timeline = timeline;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .update(patch)
    .eq("id", appId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    const e = dbError("updateApplicationStatus", error ?? { message: "update returned no row" });
    return { success: false, error: e.message };
  }

  // The status change is already persisted. A notification failure must
  // never turn a successful transition into a 500 for the student.
  try {
    await pushNotification(
      userId,
      status === "submitted" ? "status-update" : "reminder",
      status === "submitted"
        ? `Application submitted: ${app.scholarshipName}`
        : `Application updated: ${app.scholarshipName}`,
      status === "submitted"
        ? "You confirmed this application was submitted on the official portal. Track under-verification status in My Applications."
        : "Your application status changed from the previous stage.",
      "/dashboard/applications"
    );
  } catch (notifyError) {
    console.error("[updateApplicationStatus] notification failed:", notifyError);
  }

  return { success: true, application: rowToApplication(data as ApplicationRow) };
}

function statusLabel(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    "not-started": "Not Started",
    preparing: "Preparing",
    "awaiting-review": "Awaiting Student Review",
    "ready-to-submit": "Ready to Submit",
    submitted: "Submitted",
    "under-verification": "Under Verification",
    approved: "Approved",
    rejected: "Rejected",
    "more-info-required": "More Information Required",
  };
  return map[status] ?? status;
}

export async function deleteApplication(
  appId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", appId)
    .eq("user_id", userId);
  if (error) {
    console.error("[deleteApplication] delete failed:", error.message);
    return false;
  }
  return true;
}

// ----------------------------------------------------------------
// Notifications
// ----------------------------------------------------------------

type NotificationRow = {
  id: string;
  user_id: string;
  type: Notification["type"];
  title: string;
  message: string;
  read: boolean | null;
  created_at: string;
  link: string | null;
};

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.read ?? false,
    createdAt: row.created_at,
    link: row.link ?? undefined,
  };
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw dbError("listNotifications", error);
  return (data ?? []).map((row) => rowToNotification(row as NotificationRow));
}

export async function pushNotification(
  userId: string,
  type: Notification["type"],
  title: string,
  message: string,
  link?: string
): Promise<Notification> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      user_id: userId,
      type,
      title,
      message,
      read: false,
      link: link ?? null,
    })
    .select("*")
    .single();

  if (error) throw dbError("pushNotification", error);
  return rowToNotification(data as NotificationRow);
}

/**
 * Deadline-style reminders are generated by rules, so they must be
 * idempotent: `dedupeKey` makes the primary key deterministic so a
 * re-run never creates a duplicate reminder.
 * Returns the created Notification, or null when one already exists.
 */
export async function pushNotificationOnce(
  userId: string,
  type: Notification["type"],
  title: string,
  message: string,
  link: string | undefined,
  dedupeKey: string
): Promise<Notification | null> {
  const supabase = await createSupabaseServerClient();
  const id = `notif-${dedupeKey}`;

  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return null;

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      id,
      user_id: userId,
      type,
      title,
      message,
      read: false,
      link: link ?? null,
    })
    .select("*")
    .single();

  if (error) {
    // A concurrent viewers' race can hit the same PK — tolerate it.
    if (error.code === "23505") return null;
    throw dbError("pushNotificationOnce", error);
  }
  return rowToNotification(data as NotificationRow);
}

export async function markNotificationRead(
  userId: string,
  notifId?: string
): Promise<number> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (notifId) query = query.eq("id", notifId);

  const { data, error } = await query.select();
  if (error) throw dbError("markNotificationRead", error);
  return (data ?? []).length;
}

// ----------------------------------------------------------------
// AI extraction results → approved profile fields
// ----------------------------------------------------------------

/**
 * Fields that must be filled before eligibility output is trustworthy.
 * Shared by the profile API (completion %) and extraction apply, so the
 * two flows can never disagree about what "complete" means.
 */
export const ELIGIBILITY_PROFILE_FIELDS: (keyof User)[] = [
  "name",
  "phone",
  "dob",
  "gender",
  "state",
  "district",
  "category",
  "college",
  "course",
  "year",
  "familyIncome",
];

/** True when every eligibility-critical profile field is filled. */
export function computeProfileComplete(profile: User): boolean {
  return !ELIGIBILITY_PROFILE_FIELDS.some((field) => {
    const value = profile[field];
    if (value === undefined || value === null) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (field === "familyIncome" && (typeof value !== "number" || value <= 0)) return true;
    return false;
  });
}

export async function applyExtractionToProfile(
  userId: string,
  fields: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(fields)) {
    if (!EXTRACTABLE_PROFILE_FIELDS.includes(key as never)) continue;
    if (typeof value !== "string") continue;

    if (key === "annualIncome") {
      // Income arrives as free text ("₹2,40,000") — parse to a number
      // and clamp to the same range the profile API accepts. Empty or
      // non-numeric values never overwrite a real profile value.
      const n = Number(value.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(n) || n < 0 || n > 100_000_000) continue;
      patch["family_income"] = Math.round(n);
      continue;
    }

    if (value.trim().length > 120) continue;
    const column = PROFILE_FIELD_MAP[key];
    if (!column || !value.trim()) continue;
    patch[column] = value.trim();
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    const e = dbError("applyExtractionToProfile", error);
    return { success: false, error: e.message };
  }
  if (!data) return { success: false, error: "Workspace missing." };

  // Applying extracted fields can complete the profile. Keep the stored
  // completion flag honest so the dashboard does not keep sending the
  // student back to profile setup after a successful apply.
  const updated = rowToUser(data as ProfileRow);
  const complete = computeProfileComplete(updated);
  if (complete !== updated.profileComplete) {
    const { error: flagError } = await supabase
      .from("profiles")
      .update({ profile_complete: complete, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (flagError) {
      console.error("[applyExtractionToProfile] completion flag failed:", flagError.message);
    }
  }

  return { success: true };
}
