import { supabase } from "./supabase";
import type { RankingUser, InstrumentType } from "@/types/ranking";

export async function fetchTodayRankings(): Promise<RankingUser[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_rankings")
    .select(`
      user_id,
      net_practice_time,
      is_practicing,
      practice_started_at,
      current_song,
      grit_score,
      profiles!daily_rankings_user_id_fkey (
        nickname,
        instrument
      )
    `)
    .eq("date", today)
    .order("net_practice_time", { ascending: false });

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>, index: number) => {
    const profiles = row.profiles as { nickname?: string; instrument?: string } | null;
    return {
      id: row.user_id as string,
      nickname: profiles?.nickname || "익명",
      instrument: (profiles?.instrument || "piano") as InstrumentType,
      netPracticeTime: (row.net_practice_time as number) || 0,
      isPracticing: (row.is_practicing as boolean) || false,
      practiceStartedAt: (row.practice_started_at as string) || undefined,
      currentSong: (row.current_song as string) || undefined,
      gritScore: (row.grit_score as number) || 0,
      rank: index + 1,
    };
  });
}

export async function fetchMyRanking(userId: string): Promise<RankingUser | null> {
  const today = new Date().toISOString().split("T")[0];

  // Get all rankings to determine rank position
  const { data: allRankings, error: allError } = await supabase
    .from("daily_rankings")
    .select("user_id, net_practice_time")
    .eq("date", today)
    .order("net_practice_time", { ascending: false });

  if (allError || !allRankings) return null;

  const myRankIndex = allRankings.findIndex((r) => r.user_id === userId);
  if (myRankIndex === -1) return null;

  const { data, error } = await supabase
    .from("daily_rankings")
    .select(`
      user_id,
      net_practice_time,
      is_practicing,
      practice_started_at,
      current_song,
      grit_score,
      profiles!daily_rankings_user_id_fkey (
        nickname,
        instrument
      )
    `)
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const profiles = row.profiles as { nickname?: string; instrument?: string } | null;

  return {
    id: row.user_id as string,
    nickname: profiles?.nickname || "익명",
    instrument: (profiles?.instrument || "piano") as InstrumentType,
    netPracticeTime: (row.net_practice_time as number) || 0,
    isPracticing: (row.is_practicing as boolean) || false,
    practiceStartedAt: (row.practice_started_at as string) || undefined,
    currentSong: (row.current_song as string) || undefined,
    gritScore: (row.grit_score as number) || 0,
    rank: myRankIndex + 1,
  };
}
