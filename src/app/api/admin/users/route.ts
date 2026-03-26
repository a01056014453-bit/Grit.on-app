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

/** GET /api/admin/users — 전체 사용자 목록 + 통계 (service role) */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "100");
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  // 1. Auth 사용자 목록 (실제 가입일 포함)
  const { data: { users: authUsers } } = await supabaseServer.auth.admin.listUsers({
    page: Math.floor(offset / limit) + 1,
    perPage: limit,
  });

  // Auth 가입일 매핑 (user.id → created_at)
  const authCreatedMap: Record<string, string> = {};
  for (const au of authUsers ?? []) {
    authCreatedMap[au.id] = au.created_at;
  }

  // 2. 프로필 목록
  const { data: profiles, count } = await db
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const userIds = (profiles ?? []).map((p: any) => p.id);

  // 2. 연습 세션 수 (유저별)
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

  // 3. 7일 이내 실제 연습한 사용자 (practice_sessions 기반)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: recentSessions } = await db
    .from("practice_sessions")
    .select("user_id")
    .gte("start_time", weekAgo);

  const weeklyActiveIds = new Set(
    (recentSessions ?? []).map((s: any) => s.user_id),
  );

  // 4. 오늘 가입자 수 (Auth 기준)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();
  const todaySignupCount = (authUsers ?? []).filter(
    (au) => au.created_at >= todayIso,
  ).length;

  // 5. 전체 연습 경험 사용자 수
  const { data: allPracticedUsers } = await db
    .from("practice_sessions")
    .select("user_id");

  const practicedUserIds = new Set(
    (allPracticedUsers ?? []).map((s: any) => s.user_id),
  );

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
    isWeeklyActive: weeklyActiveIds.has(p.id),
    hasPracticed: practicedUserIds.has(p.id),
    createdAt: authCreatedMap[p.id] ?? p.created_at,
  }));

  return NextResponse.json({
    users,
    total: count ?? 0,
    stats: {
      todaySignups: todaySignupCount ?? 0,
      weeklyActive: weeklyActiveIds.size,
      practicedUsers: practicedUserIds.size,
    },
  });
}
