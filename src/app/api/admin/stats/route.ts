import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

function getAdminIds(): Set<string> {
  return new Set((process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean));
}

async function checkAdmin(request: NextRequest): Promise<string | null> {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || !getAdminIds().has(user.id)) return null;
  return user.id;
}

/** GET /api/admin/stats — 대시보드 통계 (service role) */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  const [
    { count: totalUsers },
    { count: totalSessions },
    { count: totalAnalyses },
    { count: totalTeachers },
    { count: pendingTeachers },
    { count: activeToday },
    { data: weeklyActive },
    { data: recentSessions },
    { data: recentSignups },
  ] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("practice_sessions").select("*", { count: "exact", head: true }),
    db.from("song_analyses").select("*", { count: "exact", head: true }),
    db.from("teachers").select("*", { count: "exact", head: true }),
    db.from("teachers").select("*", { count: "exact", head: true }).eq("verified", false),
    db.from("daily_rankings").select("*", { count: "exact", head: true }).eq("date", today),
    db.from("daily_rankings").select("user_id").gte("date", weekAgo),
    db.from("practice_sessions").select("practice_time").gte("start_time", weekAgo),
    db.from("profiles").select("id, nickname, instrument, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const uniqueWeeklyUsers = new Set(weeklyActive?.map((r: any) => r.user_id) ?? []).size;
  const avgMinutes = recentSessions?.length
    ? Math.round(recentSessions.reduce((sum: number, s: any) => sum + s.practice_time, 0) / recentSessions.length / 60)
    : 0;

  // WAU 추이 (최근 8주)
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
    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    wauTrend.push({ week: label, users: uniqueUsers });
  }

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    activeUsersToday: activeToday ?? 0,
    weeklyActiveUsers: uniqueWeeklyUsers,
    totalPracticeSessions: totalSessions ?? 0,
    avgDailyPracticeMinutes: avgMinutes,
    totalSongAnalyses: totalAnalyses ?? 0,
    totalTeachers: totalTeachers ?? 0,
    pendingVerifications: pendingTeachers ?? 0,
    recentSignups: recentSignups ?? [],
    wauTrend,
  });
}
