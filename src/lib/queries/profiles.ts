import { supabase } from "@/lib/supabase";
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
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, nickname: profile.nickname ?? "연습생", ...profile })
    .select()
    .single();

  if (error) {
    console.error("[upsertProfile]", error.message);
    return null;
  }
  return data;
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
