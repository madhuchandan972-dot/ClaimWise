// ============================================================
// ClaimWise — GET/PATCH /api/notifications
// GET   → the student's notification feed (newest first)
// PATCH → mark one (id in body) or all notifications as read
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getWorkspace, listNotifications, markNotificationRead } from "@/lib/store";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  // Ensures the workspace (blank profile) exists before reading its feed
  await getWorkspace(session.sub, session.email, session.name);
  const notifications = await listNotifications(session.sub);
  return NextResponse.json({
    success: true,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  const changed = await markNotificationRead(session.sub, id);
  return NextResponse.json({ success: true, updated: changed });
}
