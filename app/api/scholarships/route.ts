// ============================================================
// ClaimWise — GET /api/scholarships
// Read-only catalogue backed by public.scholarships.
// Filters: q, state, level, course, category, income, type, status.
// No entries are fabricated here; an empty table stays empty.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { listScholarships } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const status = searchParams.get("status") ?? "";
  const state = (searchParams.get("state") ?? "").trim().toLowerCase();
  const level = (searchParams.get("level") ?? "").trim().toLowerCase();
  const course = (searchParams.get("course") ?? "").trim().toLowerCase();
  const category = (searchParams.get("category") ?? "").trim().toLowerCase();
  const type = (searchParams.get("type") ?? "").trim().toLowerCase();
  const incomeRaw = searchParams.get("income");
  const income = incomeRaw ? Number(incomeRaw.replace(/[,\s₹]/g, "")) : null;

  let items;
  try {
    items = await listScholarships();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load the catalogue.";
    console.error("[/api/scholarships] DB error:", message);
    return NextResponse.json(
      {
        success: false,
        error: /schema|relation|does not exist/i.test(message)
          ? "The scholarship catalogue is not initialised yet. Run the Supabase migrations, then reload."
          : "The scholarship catalogue is temporarily unavailable.",
      },
      { status: 503 }
    );
  }

  const filtered = items.filter((s) => {
    if (q) {
      const haystack = [s.name, s.provider, s.description, s.scholarshipType].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (status && s.status !== status) return false;
    if (state && s.states.length > 0) {
      if (!s.states.some((x) => x.toLowerCase().includes(state))) return false;
    }
    if (level && s.educationLevel) {
      if (s.educationLevel.toLowerCase() !== level) return false;
    }
    if (course && s.courses.length > 0) {
      if (!s.courses.some((c) => c.toLowerCase().includes(course))) return false;
    }
    if (category && s.categoryRequirements.length > 0) {
      if (!s.categoryRequirements.some((c) => c.toLowerCase() === category)) return false;
    }
    if (income !== null && Number.isFinite(income) && income >= 0) {
      if (s.maxIncome !== undefined && s.maxIncome !== null && income > s.maxIncome) return false;
    }
    if (type && !s.scholarshipType.toLowerCase().includes(type)) return false;
    return true;
  });

  return NextResponse.json({
    success: true,
    count: filtered.length,
    scholarships: filtered,
    catalogueEmpty: items.length === 0,
  });
}
