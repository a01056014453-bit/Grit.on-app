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

/** GET /api/admin/users/[id] — 사용자 상세 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [
    { data: profile },
    { data: sessions },
    { data: rankings },
  ] = await Promise.all([
    db.from("profiles").select("*").eq("id", id).single(),
    db.from("practice_sessions").select("*").eq("user_id", id).order("start_time", { ascending: false }).limit(20),
    db.from("daily_rankings").select("*").eq("user_id", id).order("date", { ascending: false }).limit(30),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = {
    id: profile.id,
    nickname: profile.nickname,
    name: profile.name,
    email: profile.email,
    instrument: profile.instrument,
    level: profile.level,
    authProvider: profile.auth_provider,
    gritScore: profile.grit_score,
    totalPracticeHours: profile.total_practice_hours,
    streakDays: profile.streak_days,
    dailyGoal: profile.daily_goal,
    weeklyGoal: profile.weekly_goal,
    currentPiece: profile.current_piece,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    sessionCount: sessions?.length ?? 0,
    recentSessions: (sessions ?? []).map((s: any) => ({
      id: s.id,
      pieceName: s.piece_name,
      practiceTime: s.practice_time,
      startTime: s.start_time,
      practiceType: s.practice_type,
    })),
    rankingHistory: (rankings ?? []).map((r: any) => ({
      date: r.date,
      rank: r.rank ?? 0,
      gritScore: r.grit_score ?? 0,
      practiceMinutes: Math.round((r.net_practice_time ?? 0) / 60),
    })),
  };

  return NextResponse.json({ user });
}
