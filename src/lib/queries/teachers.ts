import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";
import type { Teacher, TeacherBadge, TeacherCareer } from "@/types";

type TeacherRow = Tables<"teachers">;

export type { Teacher };

export async function getTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("rating", { ascending: false });

  if (error) {
    console.error("[getTeachers]", error.message);
    return [];
  }

  return (data ?? []).map(rowToTeacher);
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getTeacherById]", error.message);
    return null;
  }

  return rowToTeacher(data);
}

function rowToTeacher(row: TeacherRow): Teacher {
  const rawCareer = row.career as Record<string, unknown> | null;

  const career: TeacherCareer | undefined = rawCareer
    ? {
        education: Array.isArray(rawCareer.education) ? rawCareer.education as TeacherCareer["education"] : [],
        awards: Array.isArray(rawCareer.awards) ? rawCareer.awards as TeacherCareer["awards"] : [],
        performances: Array.isArray(rawCareer.performances) ? rawCareer.performances as TeacherCareer["performances"] : [],
        studentsToUniversity: (rawCareer.studentsToUniversity as number) ?? 0,
        teachingExperience: (rawCareer.teachingExperience as number) ?? 0,
      }
    : undefined;

  return {
    id: row.id,
    name: row.name,
    title: row.title ?? "",
    bio: row.bio ?? "",
    specialty: row.specialty ?? [],
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    completedCount: row.completed_count ?? 0,
    priceCredits: row.price_credits ?? 0,
    responseRate: row.response_rate ?? 0,
    avgResponseTime: row.avg_response_time ?? 0,
    verified: row.verified ?? false,
    badges: ((row.badges as string[]) ?? []) as TeacherBadge[],
    profileImage: row.profile_image ?? undefined,
    career,
  };
}
