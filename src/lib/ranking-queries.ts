import type { RankingUser } from "@/types/ranking";

interface RankingsResponse {
  rankers: RankingUser[];
  myRanking: RankingUser | null;
  error?: string;
}

/** 랭킹 데이터 한 번에 조회 (rankers + myRanking) */
export async function fetchRankingsData(
  userId?: string
): Promise<{ rankers: RankingUser[]; myRanking: RankingUser | null }> {
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
  return {
    rankers: data.rankers ?? [],
    myRanking: data.myRanking ?? null,
  };
}

function getLocalNickname(): string | null {
  if (typeof window === "undefined") return null;
  try {
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
