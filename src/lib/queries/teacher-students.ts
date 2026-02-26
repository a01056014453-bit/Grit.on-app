import { supabase } from "@/lib/supabase";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface TeacherStudent {
  id: string;
  teacherId: string;
  studentId: string;
  nickname: string;
  instrument: string;
  grade: string;
  type: "전공" | "취미";
  weeklyPracticeMinutes: number;
  currentPieces: string[];
  lastPracticeDate?: string;
  joinedAt: string;
  totalLessons: number;
  completedLessons: number;
}

export async function getTeacherStudents(
  teacherId: string
): Promise<TeacherStudent[]> {
  const { data, error } = await db
    .from("teacher_students")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("nickname");

  if (error) {
    console.error("[getTeacherStudents]", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    teacherId: row.teacher_id,
    studentId: row.student_id,
    nickname: row.nickname,
    instrument: row.instrument ?? "piano",
    grade: row.grade ?? "",
    type: (row.type ?? "전공") as "전공" | "취미",
    weeklyPracticeMinutes: row.weekly_practice_minutes ?? 0,
    currentPieces: row.current_pieces ?? [],
    lastPracticeDate: row.last_practice_date ?? undefined,
    joinedAt: row.joined_at ?? "",
    totalLessons: row.total_lessons ?? 0,
    completedLessons: row.completed_lessons ?? 0,
  }));
}

export async function getTeacherStudentById(
  id: string
): Promise<TeacherStudent | null> {
  const { data, error } = await db
    .from("teacher_students")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;

  return {
    id: data.id,
    teacherId: data.teacher_id,
    studentId: data.student_id,
    nickname: data.nickname,
    instrument: data.instrument ?? "piano",
    grade: data.grade ?? "",
    type: (data.type ?? "전공") as "전공" | "취미",
    weeklyPracticeMinutes: data.weekly_practice_minutes ?? 0,
    currentPieces: data.current_pieces ?? [],
    lastPracticeDate: data.last_practice_date ?? undefined,
    joinedAt: data.joined_at ?? "",
    totalLessons: data.total_lessons ?? 0,
    completedLessons: data.completed_lessons ?? 0,
  };
}
