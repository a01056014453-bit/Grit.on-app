import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";
import type { WeeklyData, TodayPlanItem, AISuggestion } from "@/types";

export async function getWeeklyData(userId: string): Promise<WeeklyData[]> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("weekly_data")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekStart.toISOString().slice(0, 10))
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("[getWeeklyData]", error.message);
    return defaultWeeklyData();
  }

  if (!data || data.length === 0) return defaultWeeklyData();

  return data.map((row) => ({
    day: row.day_of_week,
    minutes: row.minutes ?? 0,
    target: row.target ?? 60,
    completed: row.completed ?? false,
  }));
}

export async function getDailyPlans(
  userId: string,
  date?: string
): Promise<TodayPlanItem[]> {
  const targetDate = date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("date", targetDate)
    .order("priority", { ascending: true });

  if (error) {
    console.error("[getDailyPlans]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    piece: row.piece,
    measures: row.measures ?? "",
    duration: row.duration ?? 15,
    priority: (row.priority as "high" | "medium" | "low") ?? "medium",
    completed: row.completed ?? false,
    note: row.note ?? "",
  }));
}

export async function getAISuggestions(userId: string): Promise<AISuggestion[]> {
  const { data, error } = await supabase
    .from("ai_suggestions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[getAISuggestions]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type as "tempo" | "dynamics" | "practice",
    title: row.title,
    description: row.description,
    priority: (row.priority as "high" | "medium" | "low") ?? "medium",
  }));
}

function defaultWeeklyData(): WeeklyData[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day: i,
    minutes: 0,
    target: 60,
    completed: false,
  }));
}
