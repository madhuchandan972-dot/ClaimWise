// ============================================================
// ClaimWise Platform — Shared Utility Functions
// ============================================================

import type { User } from "./types";

// ----------------------------------------------------------------
// cn — Combine Tailwind class strings (manual, no clsx dependency)
// ----------------------------------------------------------------
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ----------------------------------------------------------------
// formatDate — "2026-11-12T00:00:00Z" → "12 Nov 2026"
// ----------------------------------------------------------------
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ----------------------------------------------------------------
// formatFileSize — bytes → "1.2 MB" / "340 KB" / "890 B"
// ----------------------------------------------------------------
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// ----------------------------------------------------------------
// getStatusColor — returns Tailwind badge color classes for a status string
// ----------------------------------------------------------------
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    // Scholarship statuses
    open: "bg-green-100 text-green-700 border border-green-200",
    "closing-soon": "bg-amber-100 text-amber-700 border border-amber-200",
    closed: "bg-gray-100 text-gray-500 border border-gray-200",
    upcoming: "bg-blue-100 text-blue-700 border border-blue-200",

    // Application statuses
    "not-started": "bg-gray-100 text-gray-500 border border-gray-200",
    preparing: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    "awaiting-review": "bg-purple-100 text-purple-700 border border-purple-200",
    "ready-to-submit": "bg-blue-100 text-blue-700 border border-blue-200",
    submitted: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    "under-verification": "bg-orange-100 text-orange-700 border border-orange-200",
    approved: "bg-green-100 text-green-700 border border-green-200",
    rejected: "bg-red-100 text-red-700 border border-red-200",
    "more-info-required": "bg-amber-100 text-amber-700 border border-amber-200",

    // Document statuses
    pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    processed: "bg-green-100 text-green-700 border border-green-200",
    failed: "bg-red-100 text-red-700 border border-red-200",

    // Eligibility statuses
    eligible: "bg-green-100 text-green-700 border border-green-200",
    "possibly-eligible": "bg-amber-100 text-amber-700 border border-amber-200",
    "not-eligible": "bg-red-100 text-red-700 border border-red-200",
  };

  return map[status] ?? "bg-gray-100 text-gray-600 border border-gray-200";
}

// ----------------------------------------------------------------
// getDocumentIcon — returns an emoji for a DocumentType string
// ----------------------------------------------------------------
export function getDocumentIcon(type: string): string {
  const map: Record<string, string> = {
    AadhaarCard: "🪪",
    PANCard: "💳",
    PropertyDocument: "🏠",
    InsuranceDocument: "🛡️",
    IncomeCertificate: "📋",
    CasteCertificate: "📜",
    MarksCard: "📊",
    TransferCertificate: "📄",
    BankDocument: "🏦",
    Other: "📁",
  };
  return map[type] ?? "📁";
}

// ----------------------------------------------------------------
// truncateText — truncates a string to maxLength, appending "..."
// ----------------------------------------------------------------
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

// ----------------------------------------------------------------
// calculateProfileCompletion — 0–100 based on filled User fields
// ----------------------------------------------------------------
export function calculateProfileCompletion(user: Partial<User>): number {
  const fields: (keyof User)[] = [
    "name",
    "email",
    "phone",
    "dob",
    "gender",
    "state",
    "district",
    "religion",
    "category",
    "college",
    "course",
    "year",
    "familyIncome",
  ];

  let filled = 0;
  for (const field of fields) {
    const val = user[field];
    if (val !== undefined && val !== null && val !== "" && val !== 0) {
      filled++;
    }
  }

  return Math.round((filled / fields.length) * 100);
}

// ----------------------------------------------------------------
// isDeadlineSoon — true if deadline is within the next 7 days
// ----------------------------------------------------------------
export function isDeadlineSoon(deadline: string): boolean {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}
