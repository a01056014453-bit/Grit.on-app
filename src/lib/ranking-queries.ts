import type { RankingUser } from "@/types/ranking";

interface RankingsResponse {
  rankers: RankingUser[];
  myRanking: RankingUser | null;
  error?: string;
}

export async function fetchTodayRankings(userId?: string): Promise<RankingUser[]> {
  const nickname = getLocalNickname();
  let url = "/api/rankings";
  const params: string[] = [];
  if (userId) params.push(`userId=${encodeURIComponent(userId)}`);
  if (nickname) params.push(`nickname=${encodeURIComponent(nickname)}`);
  if (params.length > 0) url += `?${params.join("&")}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`랭킹 조회 실패: ${res.status}`);
  }
  const data: RankingsResponse = await res.json();
  return data.rankers ?? [];
}

function getLocalNickname(): string | null {
  try {
    // sempre-user-profile 우선 (온보딩에서 설정), 그 다음 grit-on-profile (편집 시 저장)
    const sempre = localStorage.getItem("sempre-user-profile");
    if (sempre) {
      const sp = JSON.parse(sempre);
      if (sp.nickname) return sp.nickname;
    }
    const saved = localStorage.getItem("grit-on-profile");
    if (saved) {
      const p = JSON.parse(saved);
      if (p.nickname) return p.nickname;
    }
    return null;
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
