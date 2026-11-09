// ============================================================
// ClaimWise — Dates to remember (shared engine)
//
// Collects every dated obligation in the family vault:
//   • insurance policy expiry  (insurance_records.expiry_date)
//   • financial payment dues   (financial_records.due_date)
//   • document validity end    (documents.expiry_date)
//
// Pure functions over already-fetched records. Used by:
//   • /api/notifications/reminders — pushes notifications in
//     day-buckets (idempotent, deterministic ids)
//   • /api/vault/overview — the dashboard "Dates to remember" card
// ============================================================

import type { DateReminder, FinancialRecord } from "./types";
import type { Document } from "./types";
import type { InsuranceRecord } from "./types";

/** Exact days-out buckets the notification engine reacts to. */
export type ReminderBucket = "expired" | "7-days" | "15-days" | "30-days";

const DAY_MS = 86_400_000;

/** Financial record types whose due_date is an actual payment deadline. */
const DUE_WORTHY: FinancialRecord["recordType"][] = ["loan", "debt", "obligation"];

/** Normalises a yyyy-mm-dd string to a UTC-midnight-ish local date. */
export function toDate(iso: string): Date | null {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole days between start-of-today and the target date (negative = past). */
export function daysUntil(iso: string, today = new Date()): number | null {
  const target = toDate(iso);
  if (!target) return null;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / DAY_MS);
}

export function bucketFor(days: number): ReminderBucket | null {
  if (days < 0) return "expired";
  if (days <= 7) return "7-days";
  if (days <= 15) return "15-days";
  if (days <= 30) return "30-days";
  return null;
}

function insuranceTitle(r: InsuranceRecord): string {
  const provider = r.provider?.trim() || "Insurance policy";
  return r.policyType?.trim() ? `${provider} — ${r.policyType}` : provider;
}

function financialTitle(r: FinancialRecord): string {
  const side = r.institution?.trim();
  const label = side ? `${side} — ${r.description}`.trim() : r.description;
  return (label || r.recordType).slice(0, 120);
}

/**
 * All dated items in the vault, sorted by date ascending, including
 * already-expired items. Far-future (30+ days) date entries are included;
 * callers decide how far to look ahead.
 */
export function collectDateReminders(
  documents: Document[],
  insuranceRecords: InsuranceRecord[],
  financialRecords: FinancialRecord[]
): DateReminder[] {
  const out: DateReminder[] = [];

  for (const r of insuranceRecords) {
    if (!r.expiryDate) continue;
    out.push({
      key: `insurance-expiry-${r.id}`,
      kind: "insurance-expiry",
      title: insuranceTitle(r),
      detail: "Policy expires — arrange renewal",
      date: r.expiryDate,
      link: "/dashboard/insurance",
    });
  }

  for (const r of financialRecords) {
    if (!r.dueDate) continue;
    if (!DUE_WORTHY.includes(r.recordType as FinancialRecord["recordType"])) continue;
    out.push({
      key: `due-date-${r.id}`,
      kind: "due-date",
      title: financialTitle(r),
      detail: r.outstandingAmount !== undefined && r.outstandingAmount !== null
        ? `Payment due — ₹${r.outstandingAmount.toLocaleString("en-IN")} outstanding`
        : "Payment due",
      date: r.dueDate,
      link: "/dashboard/financial",
    });
  }

  for (const d of documents) {
    if (!d.expiryDate) continue;
    out.push({
      key: `document-expiry-${d.id}`,
      kind: "document-expiry",
      title: d.name,
      detail: "Document validity ends — plan a renewal",
      date: d.expiryDate,
      link: "/dashboard/documents",
    });
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}
