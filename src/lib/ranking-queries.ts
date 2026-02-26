import type { RankingUser } from "@/types/ranking";

interface RankingsResponse {
  rankers: RankingUser[];
  myRanking: RankingUser | null;
  error?: string;
}

export async function fetchTodayRankings(): Promise<RankingUser[]> {
  const res = await fetch("/api/rankings");
  if (!res.ok) {
    throw new Error(`랭킹 조회 실패: ${res.status}`);
  }
  const data: RankingsResponse = await res.json();
  return data.rankers ?? [];
}

export async function fetchMyRanking(
  userId: string
): Promise<RankingUser | null> {
  const res = await fetch(`/api/rankings?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    throw new Error(`내 랭킹 조회 실패: ${res.status}`);
  }
  const data: RankingsResponse = await res.json();
  return data.myRanking ?? null;
}
