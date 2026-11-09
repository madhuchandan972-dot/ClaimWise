// ============================================================
// ClaimWise — GET /api/notifications/reminders
//
// Deadline reminder engine (real computation, no fabricated data):
// every tracked application that is still being prepared gets its
// scholarship deadline evaluated against today. Reminders fire in
// day-buckets (15 / 8 / 3 / overdue) and are idempotent — a
// reminder is only ever created once per application + bucket,
// because the notification id is deterministic.
//
// Designed for Vercel Cron / external schedulers on the server,
// and safe to call from the dashboard on page load (all work is
// RLS-scoped to the signed-in student through the store layer).
//
// Response: { success, created, unreadCountAfter, reminders[] }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  listApplications,
  listDocuments,
  listScholarships,
  listNotifications,
  pushNotificationOnce,
} from "@/lib/store";
import { listFinancialRecords, listInsuranceRecords } from "@/lib/vault";
import { bucketFor, daysUntil, collectDateReminders } from "@/lib/dates";
import { listSavedScholarships } from "@/lib/vault";
import type { Application, Scholarship } from "@/lib/types";

/** Application statuses a deadline reminder is meaningful for. */
const REMINDER_WORTHY: NonNullable<Application["status"]>[] = [
  "not-started",
  "preparing",
  "awaiting-review",
  "ready-to-submit",
  "more-info-required",
];

interface Bucket {
  key: string;
  /** Inclusive upper bound of days until deadline (days <= 0 → overdue). */
  maxDaysInclusive: number;
  title: (name: string, days: number) => string;
  message: (name: string, deadlineLabel: string, days: number) => string;
}

const BUCKETS: Bucket[] = [
  {
    key: "overdue",
    maxDaysInclusive: 0,
    title: (n) => `Deadline passed: ${n}`,
    message: (n, label, d) =>
      `The deadline for "${n}" passed on ${label} (${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} ago). If you submitted on the portal, confirm the submission in My Applications; otherwise the scheme has closed.`,
  },
  {
    key: "3-days",
    maxDaysInclusive: 3,
    /** Title is overridden in the generator (needs the scholarship name). */
    title: (n) => `Last days to submit: ${n}`,
    message: (n) => `Final days: "${n}" closes very soon. Finish the remaining steps and submit before the deadline.`,
  },
  {
    key: "8-days",
    maxDaysInclusive: 8,
    title: (n) => `Closing this week: ${n}`,
    message: (n) => `"${n}" closes this week. Ideal moment to check the required documents and field preparation.`,
  },
  {
    key: "15-days",
    maxDaysInclusive: 15,
    title: (n) => `Deadline reminder: ${n}`,
    message: (n, label, d) => `"${n}" closes in ${d} days (${label}). Review your application plan now so nothing is left to the last day.`,
  },
];

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [applications, scholarships] = await Promise.all([
    listApplications(session.sub),
    listScholarships().catch(() => [] as Scholarship[]),
  ]);
  const byId = new Map(scholarships.map((s) => [s.id, s]));

  const created: { applicationId: string; title: string; bucket: string }[] = [];
  /** Scholarship ids already tracked as applications (their reminders are app-scoped). */
  const trackedIds = new Set(applications.map((a) => a.scholarshipId));

  for (const app of applications) {
    if (!REMINDER_WORTHY.includes(app.status)) continue;

    const scholarship = byId.get(app.scholarshipId);
    if (!scholarship || !scholarship.deadline) continue;

    const deadline = new Date(scholarship.deadline);
    if (Number.isNaN(deadline.getTime())) continue;
    deadline.setHours(23, 59, 59, 999);

    const msLeft = deadline.getTime() - today.getTime();
    if (!Number.isFinite(msLeft)) continue;
    const days = Math.ceil(msLeft / 86_400_000);
    if (days > 15) continue; // No bucket — too far away.

    const bucket = BUCKETS.find((b) => days <= b.maxDaysInclusive);
    if (!bucket) continue;

    const deadlineLabel = new Date(scholarship.deadline).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const title =
      bucket.key === "3-days"
        ? `Last days to submit: ${app.scholarshipName}`
        : bucket.title(app.scholarshipName, days);
    const message = bucket.message(app.scholarshipName, deadlineLabel, days);

    const notification = await pushNotificationOnce(
      session.sub,
      "deadline",
      title,
      message,
      "/dashboard/applications",
      `deadline-${app.id}-${bucket.key}`
    );

    if (notification) {
      created.push({ applicationId: app.id, title, bucket: bucket.key });
    }
  }

  // Saved scholarships no one has started tracking yet. A saved entry
  // with an approaching deadline still deserves a heads-up so students
  // do not lose a scheme they shortlisted (same day-buckets, same
  // idempotent ids — `deadline-saved-...`).
  let saved: { scholarshipId: string }[] = [];
  try {
    const savedList = await listSavedScholarships(session.sub);
    saved = savedList
      .map((entry) => ({ scholarshipId: entry.scholarshipId }))
      .filter((e) => !trackedIds.has(e.scholarshipId));
  } catch {
    // Saved list unavailable — reminders simply skip it this run.
  }

  for (const { scholarshipId } of saved) {
    const scholarship = byId.get(scholarshipId);
    if (!scholarship || !scholarship.deadline) continue;

    const deadline = new Date(scholarship.deadline);
    if (Number.isNaN(deadline.getTime())) continue;
    deadline.setHours(23, 59, 59, 999);

    const msLeft = deadline.getTime() - today.getTime();
    if (!Number.isFinite(msLeft)) continue;
    const days = Math.ceil(msLeft / 86_400_000);
    if (days > 15 || days < 0) continue; // Saved entries only get proactive buckets.

    const bucket = BUCKETS.find(
      (b) => b.key !== "overdue" && days <= b.maxDaysInclusive
    );
    if (!bucket) continue;

    const deadlineLabel = new Date(scholarship.deadline).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const title = bucket.title(scholarship.name, days);
    const message =
      bucket.key === "3-days"
        ? `Final days: "${scholarship.name}" (saved on ClaimWise) closes very soon. Start tracking it in My Applications and submit before the deadline.`
        : bucket.message(scholarship.name, deadlineLabel, days);

    const linkage = `/dashboard/scholarships/${scholarship.id}`;
    const notification = await pushNotificationOnce(
      session.sub,
      "deadline",
      title,
      message,
      linkage,
      `deadline-saved-${scholarship.id}-${bucket.key}`
    );

    if (notification) {
      created.push({ applicationId: scholarship.id, title, bucket: bucket.key });
    }
  }

  // ── Family vault dates: insurance expiries, payment dues, document
  // validity ends. Same day-bucket model and idempotent ids as the
  // scholarship sweep above — a notification is created once per
  // source record + bucket, never spammed.
  try {
    const [documents, insuranceRecords, financialRecords] = await Promise.all([
      listDocuments(session.sub),
      listInsuranceRecords(session.sub),
      listFinancialRecords(session.sub),
    ]);
    const reminders = collectDateReminders(documents, insuranceRecords, financialRecords);

    for (const reminder of reminders) {
      const days = daysUntil(reminder.date, today);
      if (days === null) continue;
      const bucket = bucketFor(days);
      if (!bucket) continue; // Outside all buckets (>30 days away)

      const label = new Date(`${reminder.date.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      let title: string;
      let message: string;
      if (bucket === "expired") {
        const ago = Math.abs(days) === 1 ? "yesterday" : `${Math.abs(days)} days ago`;
        title = `${reminder.title} — date passed`;
        message = `${reminder.detail} on ${label} (${ago}). Open the linked section: update the date or act on it.`;
      } else {
        title = `${reminder.title}: ${days} days left`;
        message = `${reminder.detail} — ${label}${days === 0 ? " (today)" : ` (in ${days} days)`}.`;
      }

      await pushNotificationOnce(
        session.sub,
        "reminder",
        title,
        message,
        reminder.link,
        `${reminder.key}-${bucket}`
      );
    }
  } catch {
    // Vault reminders are additive; a schema that hasn't run 003/007
    // must never break the scholarship sweep above.
  }

  // Unread count after generation, so the sidebar badge stays honest.
  const notifications = await listNotifications(session.sub);

  return NextResponse.json({
    success: true,
    created,
    count: created.length,
    unreadCountAfter: notifications.filter((n) => !n.read).length,
  });
}
