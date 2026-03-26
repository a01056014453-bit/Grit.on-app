import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

function getAdminIds(): Set<string> {
  return new Set((process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean));
}

async function checkAdmin(request: NextRequest): Promise<boolean> {
  try {
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    return !!user && getAdminIds().has(user.id);
  } catch {
    return false;
  }
}

/** GET /api/admin/stats — 대시보드 통계 */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    const [
      { count: totalUsers },
      { count: totalSessions },
      { count: totalAnalyses },
      { count: totalTeachers },
      { count: pendingTeachers },
      { data: todayRankings },
      { data: weeklyRankings },
      { data: recentSessions },
      { data: recentSignups },
    ] = await Promise.all([
      db.from("profiles").select("*", { count: "exact", head: true }),
      db.from("practice_sessions").select("*", { count: "exact", head: true }),
      db.from("song_analyses").select("*", { count: "exact", head: true }),
      db.from("teachers").select("*", { count: "exact", head: true }),
      db.from("teachers").select("*", { count: "exact", head: true }).eq("verified", false),
      // DAU: user_id 목록으로 가져와서 unique 카운트
      db.from("daily_rankings").select("user_id").eq("date", today),
      db.from("daily_rankings").select("user_id").gte("date", weekAgo),
      db.from("practice_sessions").select("practice_time").gte("start_time", weekAgo),
      db.from("profiles").select("id, nickname, instrument, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    // DAU: unique user_id 카운트
    const activeToday = new Set((todayRankings ?? []).map((r: any) => r.user_id)).size;
    const uniqueWeeklyUsers = new Set((weeklyRankings ?? []).map((r: any) => r.user_id)).size;

    const avgMinutes = recentSessions?.length
      ? Math.round(recentSessions.reduce((sum: number, s: any) => sum + s.practice_time, 0) / recentSessions.length / 60)
      : 0;

    // WAU 추이 (최근 8주) — 주 단위로 끝나는 날짜 라벨
    const wauTrend: { week: string; users: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(Date.now() - i * 7 * 86400000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 86400000);
      const startStr = weekStart.toISOString().split("T")[0];
      const endStr = weekEnd.toISOString().split("T")[0];

      const { data: weekData } = await db
        .from("daily_rankings")
        .select("user_id")
        .gte("date", startStr)
        .lt("date", endStr);

      const uniqueUsers = new Set((weekData ?? []).map((r: any) => r.user_id)).size;
      // 라벨: 주가 끝나는 날짜
      const label = `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
      wauTrend.push({ week: label, users: uniqueUsers });
    }

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      activeUsersToday: activeToday,
      weeklyActiveUsers: uniqueWeeklyUsers,
      totalPracticeSessions: totalSessions ?? 0,
      avgDailyPracticeMinutes: avgMinutes,
      totalSongAnalyses: totalAnalyses ?? 0,
      totalTeachers: totalTeachers ?? 0,
      pendingVerifications: pendingTeachers ?? 0,
      recentSignups: recentSignups ?? [],
      wauTrend,
    });
  } catch (err) {
    console.error("[admin/stats] 서버 오류:", err);
    return NextResponse.json({ error: "통계 조회에 실패했습니다" }, { status: 500 });
  }
}
