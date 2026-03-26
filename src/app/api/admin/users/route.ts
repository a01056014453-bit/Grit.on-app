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

/** GET /api/admin/users — Auth 기준 전체 사용자 + profiles 조인 */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  try {
    // 1. Auth 전체 사용자 (실제 가입일 기준 — source of truth)
    const { data: { users: authUsers }, error: authError } =
      await supabaseServer.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (authError || !authUsers) {
      console.error("[admin/users] Auth 사용자 조회 실패:", authError);
      return NextResponse.json(
        { error: "사용자 목록을 불러올 수 없습니다" },
        { status: 500 },
      );
    }

    // Auth 가입일 순 정렬 (최신 먼저)
    const sortedAuth = [...authUsers].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // 2. 전체 프로필 조회 (Auth와 조인용)
    const { data: profiles } = await db
      .from("profiles")
      .select("*");

    const profileMap: Record<string, any> = {};
    for (const p of profiles ?? []) {
      profileMap[p.id] = p;
    }

    // 3. 연습 세션 수
    const { data: allSessions } = await db
      .from("practice_sessions")
      .select("user_id, start_time");

    const sessionCounts: Record<string, number> = {};
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const weeklyActiveIds = new Set<string>();
    const practicedUserIds = new Set<string>();

    for (const s of allSessions ?? []) {
      const uid = s.user_id as string;
      sessionCounts[uid] = (sessionCounts[uid] ?? 0) + 1;
      practicedUserIds.add(uid);
      if (s.start_time >= weekAgo) {
        weeklyActiveIds.add(uid);
      }
    }

    // 4. 오늘 가입자
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    // 5. 사용자 목록 조립 (Auth 기준 — 프로필 없는 사용자도 포함)
    const users = sortedAuth.map((au) => {
      const p = profileMap[au.id];
      const isToday = au.created_at >= todayIso;
      return {
        id: au.id,
        nickname: p?.nickname ?? "(온보딩 미완료)",
        name: p?.name ?? null,
        email: au.email ?? null,
        instrument: p?.instrument ?? "-",
        level: p?.level ?? null,
        authProvider: au.app_metadata?.provider ?? null,
        gritScore: p?.grit_score ?? 0,
        sessionCount: sessionCounts[au.id] ?? 0,
        isWeeklyActive: weeklyActiveIds.has(au.id),
        hasPracticed: practicedUserIds.has(au.id),
        isToday,
        createdAt: au.created_at,
      };
    });

    const todaySignupCount = users.filter((u) => u.isToday).length;

    return NextResponse.json({
      users,
      total: authUsers.length,
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
