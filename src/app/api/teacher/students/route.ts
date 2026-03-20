import { NextRequest, NextResponse } from "next/server";
import { getRequestUserId, getTeacherIdForUser } from "@/lib/api-auth";
import { supabaseServer } from "@/lib/supabase-server";

/** GET /api/teacher/students — 등록된 학생 목록 조회 */
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

    const db = supabaseServer as any;
    const { data, error } = await db
      .from("teacher_students")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("nickname", { ascending: true });

    if (error) {
      console.error("[GET /api/teacher/students]", error.message);
      return NextResponse.json({ error: "학생 목록 조회 실패" }, { status: 500 });
    }

    return NextResponse.json({ students: data ?? [] });
  } catch (err) {
    console.error("[GET /api/teacher/students]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
