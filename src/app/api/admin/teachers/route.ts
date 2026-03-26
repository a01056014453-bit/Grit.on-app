import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

function getAdminIds(): Set<string> {
  return new Set((process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean));
}

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return !!user && getAdminIds().has(user.id);
}

/** GET /api/admin/teachers — 전체 선생님 목록 */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data } = await db
    .from("teachers")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json({ teachers: data ?? [] });
}

/** PATCH /api/admin/teachers — 승인/거절 처리 */
export async function PATCH(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, action, reason } = body as { id: string; action: string; reason?: string };

  if (!id || !action) {
    return NextResponse.json({ error: "Missing id or action" }, { status: 400 });
  }

  const { data: row } = await db.from("teachers").select("career").eq("id", id).single();
  if (!row) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const career = (row.career as Record<string, unknown>) ?? {};
  const verification = (career.verification as Record<string, unknown>) ?? {};

  if (action === "approve") {
    await db
      .from("teachers")
      .update({
        verified: true,
        career: {
          ...career,
          verification: {
            ...verification,
            status: "approved",
            reviewedAt: new Date().toISOString(),
          },
        },
      })
      .eq("id", id);

    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    await db
      .from("teachers")
      .update({
        career: {
          ...career,
          verification: {
            ...verification,
            status: "rejected",
            reviewedAt: new Date().toISOString(),
            rejectReason: reason ?? "서류 미비",
          },
        },
      })
      .eq("id", id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
