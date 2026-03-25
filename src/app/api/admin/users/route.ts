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

/** GET /api/admin/users — 전체 사용자 목록 (service role) */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "100");
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const { data: profiles, count } = await db
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // 각 유저의 최근 연습 세션 수 조회
  const userIds = (profiles ?? []).map((p: any) => p.id);

  let sessionCounts: Record<string, number> = {};
  if (userIds.length > 0) {
    const { data: sessions } = await db
      .from("practice_sessions")
      .select("user_id")
      .in("user_id", userIds);

    sessionCounts = (sessions ?? []).reduce((acc: Record<string, number>, s: any) => {
      acc[s.user_id] = (acc[s.user_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const users = (profiles ?? []).map((p: any) => ({
    id: p.id,
    nickname: p.nickname,
    name: p.name,
    email: p.email,
    instrument: p.instrument,
    level: p.level,
    authProvider: p.auth_provider,
    gritScore: p.grit_score,
    totalPracticeHours: p.total_practice_hours,
    streakDays: p.streak_days,
    dailyGoal: p.daily_goal,
    sessionCount: sessionCounts[p.id] ?? 0,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));

  return NextResponse.json({ users, total: count ?? 0 });
}
