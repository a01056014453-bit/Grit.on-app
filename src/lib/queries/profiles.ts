import { supabase } from "@/lib/supabase";
import { dbMutate } from "@/lib/db-mutate";
import type { Tables } from "@/types/database";
import type { User, Stats } from "@/types";

type Profile = Tables<"profiles">;

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[getProfile]", error.message);
    return null;
  }
  return data;
}

export async function upsertProfile(
  userId: string,
  profile: Partial<Profile>
): Promise<Profile | null> {
  const result = await dbMutate<Profile>({
    table: "profiles",
    operation: "upsert",
    data: { id: userId, nickname: profile.nickname ?? "연습생", ...profile },
    returnData: true,
  });

  if (!result.success) return null;
  return result.data;
}

/** 이메일로 기존 가입 프로바이더 확인 (다른 소셜 로그인 차단용) */
export async function getExistingProvider(
  email: string,
  excludeUserId?: string
): Promise<string | null> {
  if (!email) return null;

  let query = supabase
    .from("profiles")
    .select("auth_provider")
    .eq("email", email)
    .not("auth_provider", "is", null);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data, error } = await query.limit(1).single();
  if (error || !data) return null;
  return data.auth_provider;
}

/** 닉네임 중복 체크 (자기 자신은 제외) */
export async function isNicknameAvailable(
  nickname: string,
  excludeUserId?: string
): Promise<boolean> {
  const trimmed = nickname.trim();
  if (trimmed.length < 2) return false;

  let query = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("nickname", trimmed);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { count, error } = await query;
  if (error) {
    console.error("[isNicknameAvailable]", error.message);
    return true; // 에러 시 허용 (UX 우선)
  }
  return (count ?? 0) === 0;
}

/** Profile → User 타입 변환 */
export function profileToUser(profile: Profile | null): User {
  if (!profile) {
    return { name: "연습생", instrument: "Piano", level: "", currentPiece: "" };
  }
  return {
    name: profile.nickname ?? profile.name ?? "연습생",
    instrument: profile.instrument ?? "piano",
    level: profile.level ?? "",
    currentPiece: profile.current_piece ?? "",
  };
}

/** 통계 계산 (practice_sessions 기반) */
export async function getStats(userId: string): Promise<Stats> {
  const empty: Stats = {
    totalHours: 0,
    weekSessions: 0,
    streakDays: 0,
    todayMinutes: 0,
    dailyGoal: 60,
    weeklyGoal: 420,
    weeklyProgress: 0,
    averageScore: 0,
    totalRecordings: 0,
  };

  const [profile, sessions, recordings] = await Promise.all([
    getProfile(userId),
    supabase
      .from("practice_sessions")
      .select("practice_time, start_time")
      .eq("user_id", userId),
    supabase
      .from("recordings")
      .select("score")
      .eq("user_id", userId),
  ]);

  if (sessions.error || !sessions.data) return empty;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  let totalSeconds = 0;
  let todaySeconds = 0;
  let weekSessions = 0;
  const practiceDates = new Set<string>();

  for (const s of sessions.data) {
    totalSeconds += s.practice_time;
    const dateStr = s.start_time.slice(0, 10);
    practiceDates.add(dateStr);

    if (dateStr === todayStr) todaySeconds += s.practice_time;
    if (new Date(s.start_time) >= weekAgo) weekSessions++;
  }

  // 연속 일수 계산
  let streakDays = 0;
  const d = new Date(todayStr);
  while (practiceDates.has(d.toISOString().slice(0, 10))) {
    streakDays++;
    d.setDate(d.getDate() - 1);
  }

  // 주간 진행률 (분)
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  let weeklyProgress = 0;
  for (const s of sessions.data) {
    if (new Date(s.start_time) >= weekStart) {
      weeklyProgress += s.practice_time;
    }
  }

  const recData = recordings.data ?? [];
  const avgScore =
    recData.length > 0
      ? Math.round(
          recData.reduce((sum, r) => sum + (r.score ?? 0), 0) / recData.length
        )
      : 0;

  return {
    totalHours: Math.round(totalSeconds / 3600),
    weekSessions,
    streakDays,
    todayMinutes: Math.round(todaySeconds / 60),
    dailyGoal: profile?.daily_goal ?? 60,
    weeklyGoal: profile?.weekly_goal ?? 420,
    weeklyProgress: Math.round(weeklyProgress / 60),
    averageScore: avgScore,
    totalRecordings: recData.length,
  };
}
