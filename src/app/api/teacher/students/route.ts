import { NextRequest, NextResponse } from "next/server";
import { getRequestUserId, getTeacherIdForUser } from "@/lib/api-auth";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

interface PracticeSession {
  practice_time: number;
  start_time: string;
  piece_name: string;
}

function getWeekAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

function buildStudentStats(sessions: PracticeSession[]) {
  const weekAgo = new Date(getWeekAgo());
  let weeklyMinutes = 0;
  let lastPracticeDate: string | null = null;
  const recentPieces = new Set<string>();

  for (const s of sessions) {
    const sessionDate = new Date(s.start_time);

    // 주간 연습 시간
    if (sessionDate >= weekAgo) {
      weeklyMinutes += Math.round(s.practice_time / 60);
      if (s.piece_name) recentPieces.add(s.piece_name);
    }

    // 마지막 연습일
    if (!lastPracticeDate || s.start_time > lastPracticeDate) {
      lastPracticeDate = s.start_time;
    }
  }

  return {
    weeklyPracticeMinutes: weeklyMinutes,
    lastPracticeDate: lastPracticeDate?.slice(0, 10) ?? null,
    currentPieces: Array.from(recentPieces).slice(0, 5),
    totalSessions: sessions.length,
  };
}

/** GET /api/teacher/students — 등록된 학생 목록 + 실시간 연습 데이터 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const teacherId = await getTeacherIdForUser(userId);
    if (!teacherId) {
      return NextResponse.json({ error: "선생님 인증이 필요합니다." }, { status: 403 });
    }

    // 1. teacher_students 조회
    const { data: links, error } = await db
      .from("teacher_students")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("nickname", { ascending: true });

    if (error) {
      console.error("[GET /api/teacher/students]", error.message);
      return NextResponse.json({ error: "학생 목록 조회 실패" }, { status: 500 });
    }

    if (!links || links.length === 0) {
      return NextResponse.json({ students: [] });
    }

    // 2. 각 학생의 연습 세션 조회 (최근 30일)
    const studentIds = links.map((l: any) => l.student_id).filter(Boolean);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: allSessions } = await db
      .from("practice_sessions")
      .select("user_id, practice_time, start_time, piece_name")
      .in("user_id", studentIds)
      .gte("start_time", thirtyDaysAgo.toISOString())
      .order("start_time", { ascending: false });

    // 3. 학생별로 세션 그룹핑
    const sessionsByStudent = new Map<string, PracticeSession[]>();
    for (const s of allSessions ?? []) {
      const list = sessionsByStudent.get(s.user_id) ?? [];
      list.push(s);
      sessionsByStudent.set(s.user_id, list);
    }

    // 4. 학생 프로필 조회 (최신 닉네임, 악기 등)
    const { data: profiles } = await db
      .from("profiles")
      .select("id, nickname, instrument, level")
      .in("id", studentIds);

    const profileMap = new Map<string, any>();
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p);
    }

    // 5. 데이터 병합
    const students = links.map((link: any) => {
      const studentId = link.student_id;
      const sessions = sessionsByStudent.get(studentId) ?? [];
      const stats = buildStudentStats(sessions);
      const profile = profileMap.get(studentId);

      return {
        id: link.id,
        studentId,
        nickname: profile?.nickname ?? link.nickname ?? "학생",
        instrument: profile?.instrument ?? link.instrument ?? "피아노",
        grade: profile?.level ?? link.grade ?? "",
        type: link.type ?? link.category ?? "취미",
        weeklyPracticeMinutes: stats.weeklyPracticeMinutes,
        currentPieces: stats.currentPieces,
        lastPracticeDate: stats.lastPracticeDate,
        joinedAt: link.joined_at ?? "",
        totalLessons: link.total_lessons ?? 0,
        completedLessons: link.completed_lessons ?? 0,
        totalSessions: stats.totalSessions,
      };
    });

    return NextResponse.json({ students });
  } catch (err) {
    console.error("[GET /api/teacher/students]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
