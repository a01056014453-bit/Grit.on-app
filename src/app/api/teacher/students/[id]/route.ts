import { NextRequest, NextResponse } from "next/server";
import { getRequestUserId, getTeacherIdForUser } from "@/lib/api-auth";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

/** GET /api/teacher/students/[id] — 학생 상세 + 연습 기록 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const teacherId = await getTeacherIdForUser(userId);
    if (!teacherId) {
      return NextResponse.json({ error: "선생님 인증이 필요합니다." }, { status: 403 });
    }

    const { id: linkId } = await params;

    // teacher_students 링크 확인
    const { data: link, error } = await db
      .from("teacher_students")
      .select("*")
      .eq("id", linkId)
      .eq("teacher_id", teacherId)
      .single();

    if (error || !link) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
    }

    const studentId = link.student_id;

    // 프로필 조회
    const { data: profile } = await db
      .from("profiles")
      .select("id, nickname, instrument, level")
      .eq("id", studentId)
      .single();

    // 최근 30일 연습 세션
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions } = await db
      .from("practice_sessions")
      .select("id, piece_name, composer, start_time, end_time, practice_time, total_time, practice_type, label")
      .eq("user_id", studentId)
      .gte("start_time", thirtyDaysAgo.toISOString())
      .order("start_time", { ascending: false });

    const recentSessions = sessions ?? [];

    // 통계 계산
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    let weeklyMinutes = 0;
    let totalMinutes = 0;
    const practiceDates = new Set<string>();
    const piecesThisWeek = new Set<string>();
    const dailyMinutes: Record<string, number> = {};

    for (const s of recentSessions) {
      const mins = Math.round(s.practice_time / 60);
      const dateStr = s.start_time.slice(0, 10);
      totalMinutes += mins;
      practiceDates.add(dateStr);
      dailyMinutes[dateStr] = (dailyMinutes[dateStr] ?? 0) + mins;

      if (new Date(s.start_time) >= weekAgo) {
        weeklyMinutes += mins;
        if (s.piece_name) piecesThisWeek.add(s.piece_name);
      }
    }

    // 연속 연습일 계산
    let streakDays = 0;
    const today = new Date();
    const checkDate = new Date(today.toISOString().slice(0, 10));
    while (practiceDates.has(checkDate.toISOString().slice(0, 10))) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // 최근 7일 일별 연습 시간 (차트용)
    const weeklyChart: { date: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      weeklyChart.push({
        date: dateStr,
        minutes: dailyMinutes[dateStr] ?? 0,
      });
    }

    const student = {
      id: link.id,
      studentId,
      nickname: profile?.nickname ?? link.nickname ?? "학생",
      instrument: profile?.instrument ?? link.instrument ?? "피아노",
      grade: profile?.level ?? link.grade ?? "",
      type: link.type ?? link.category ?? "취미",
      joinedAt: link.joined_at ?? "",
      totalLessons: link.total_lessons ?? 0,
      completedLessons: link.completed_lessons ?? 0,
      stats: {
        weeklyPracticeMinutes: weeklyMinutes,
        totalPracticeMinutes: totalMinutes,
        avgDailyMinutes: practiceDates.size > 0 ? Math.round(totalMinutes / practiceDates.size) : 0,
        practiceDays: practiceDates.size,
        streakDays,
        currentPieces: Array.from(piecesThisWeek),
        lastPracticeDate: recentSessions[0]?.start_time?.slice(0, 10) ?? null,
      },
      weeklyChart,
      recentSessions: recentSessions.slice(0, 20).map((s: any) => ({
        id: s.id,
        pieceName: s.piece_name,
        composer: s.composer,
        startTime: s.start_time,
        practiceMinutes: Math.round(s.practice_time / 60),
        practiceType: s.practice_type,
        label: s.label,
      })),
    };

    return NextResponse.json({ student });
  } catch (err) {
    console.error("[GET /api/teacher/students/[id]]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
