import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

function getAdminIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  );
}

async function checkAdmin(request: NextRequest): Promise<boolean> {
  try {
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user || !getAdminIds().has(user.id)) {
      console.error("[admin/users] 관리자 인증 실패:", user?.id ?? "비인증");
      return false;
    }
    return true;
  } catch (err) {
    console.error("[admin/users] 관리자 인증 오류:", err);
    return false;
  }
}

/** GET /api/admin/users — 전체 사용자 목록 + 통계 (service role) */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "100");
    const offset = parseInt(url.searchParams.get("offset") ?? "0");

    // 1. Auth 사용자 목록 (실제 가입일)
    let authCreatedMap: Record<string, string> = {};
    let allAuthUsers: { id: string; created_at: string }[] = [];
    try {
      const { data: { users: authUsers } } = await supabaseServer.auth.admin.listUsers({
        page: Math.floor(offset / limit) + 1,
        perPage: limit,
      });
      allAuthUsers = (authUsers ?? []).map((au) => ({ id: au.id, created_at: au.created_at }));
      for (const au of allAuthUsers) {
        authCreatedMap[au.id] = au.created_at;
      }
    } catch (err) {
      console.error("[admin/users] Auth 사용자 목록 조회 실패:", err);
    }

    // 2. 프로필 목록
    const { data: profiles, error: profilesError, count } = await db
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (profilesError) {
      console.error("[admin/users] 프로필 조회 실패:", profilesError.message);
      return NextResponse.json(
        { error: "사용자 목록을 불러올 수 없습니다" },
        { status: 500 },
      );
    }

    const userIds = (profiles ?? []).map((p: any) => p.id as string);

    // 3. 연습 세션 수 (유저별)
    let sessionCounts: Record<string, number> = {};
    if (userIds.length > 0) {
      const { data: sessions, error: sessionsError } = await db
        .from("practice_sessions")
        .select("user_id")
        .in("user_id", userIds);

      if (sessionsError) {
        console.error("[admin/users] 세션 조회 실패:", sessionsError.message);
      }

      sessionCounts = (sessions ?? []).reduce((acc: Record<string, number>, s: any) => {
        acc[s.user_id] = (acc[s.user_id] ?? 0) + 1;
        return acc;
      }, {});
    }

    // 4. 7일 이내 실제 연습한 사용자 (practice_sessions 기반)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: recentSessions } = await db
      .from("practice_sessions")
      .select("user_id")
      .gte("start_time", weekAgo);

    const weeklyActiveIds = new Set(
      (recentSessions ?? []).map((s: any) => s.user_id as string),
    );

    // 5. 오늘 가입자 수 (Auth 기준)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();
    const todaySignupCount = allAuthUsers.filter(
      (au) => au.created_at >= todayIso,
    ).length;

    // 6. 전체 연습 경험 사용자 수
    const { data: allPracticedUsers } = await db
      .from("practice_sessions")
      .select("user_id");

    const practicedUserIds = new Set(
      (allPracticedUsers ?? []).map((s: any) => s.user_id as string),
    );

    // 응답 조립
    const users = (profiles ?? []).map((p: any) => ({
      id: p.id as string,
      nickname: (p.nickname ?? "연습생") as string,
      name: p.name as string | null,
      email: p.email as string | null,
      instrument: (p.instrument ?? "-") as string,
      level: p.level as string | null,
      authProvider: p.auth_provider as string | null,
      gritScore: (p.grit_score ?? 0) as number,
      sessionCount: sessionCounts[p.id] ?? 0,
      isWeeklyActive: weeklyActiveIds.has(p.id),
      hasPracticed: practicedUserIds.has(p.id),
      createdAt: (authCreatedMap[p.id] ?? p.created_at) as string,
    }));

    return NextResponse.json({
      users,
      total: count ?? 0,
      stats: {
        todaySignups: todaySignupCount,
        weeklyActive: weeklyActiveIds.size,
        practicedUsers: practicedUserIds.size,
      },
    });
  } catch (err) {
    console.error("[admin/users] 서버 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
