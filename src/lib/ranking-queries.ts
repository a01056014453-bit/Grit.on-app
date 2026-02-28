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

function getLocalNickname(): string | null {
  try {
    const saved = localStorage.getItem("grit-on-profile");
    const sempreSaved = localStorage.getItem("sempre-user-profile");
    const profile = saved ? JSON.parse(saved) : sempreSaved ? JSON.parse(sempreSaved) : null;
    return profile?.nickname || null;
  } catch {
    return null;
  }
}

export async function fetchMyRanking(
  userId: string
): Promise<RankingUser | null> {
  const nickname = getLocalNickname();
  let url = `/api/rankings?userId=${encodeURIComponent(userId)}`;
  if (nickname) {
    url += `&nickname=${encodeURIComponent(nickname)}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`내 랭킹 조회 실패: ${res.status}`);
  }
  const data: RankingsResponse = await res.json();
  return data.myRanking ?? null;
}
