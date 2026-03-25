import type { RankingUser, RankingFilter, SchoolOption } from "@/types/ranking";

interface RankingsResponse {
  rankers: RankingUser[];
  myRanking: RankingUser | null;
  filter?: {
    type: string;
    totalCount: number;
  };
  error?: string;
}

/** 랭킹 데이터 조회 (필터 지원) */
export async function fetchRankingsData(
  userId?: string,
  filter?: RankingFilter,
): Promise<{ rankers: RankingUser[]; myRanking: RankingUser | null; totalCount: number }> {
  const nickname = getLocalNickname();
  const params: string[] = [];

  if (userId) params.push(`userId=${encodeURIComponent(userId)}`);
  if (nickname) params.push(`nickname=${encodeURIComponent(nickname)}`);
  if (filter?.schoolId) params.push(`schoolId=${encodeURIComponent(filter.schoolId)}`);
  if (filter?.instrument) params.push(`instrument=${encodeURIComponent(filter.instrument)}`);

  const url = `/api/rankings${params.length > 0 ? `?${params.join("&")}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`랭킹 조회 실패: ${res.status}`);
  }
  const data: RankingsResponse = await res.json();
  return {
    rankers: data.rankers ?? [],
    myRanking: data.myRanking ?? null,
    totalCount: data.filter?.totalCount ?? data.rankers?.length ?? 0,
  };
}

/** 전체 학교 목록 조회 (입시룸 가입 불필요) */
export async function fetchUserSchools(): Promise<SchoolOption[]> {
  try {
    const res = await fetch(`/api/db/query?table=schools&limit=50`);
    if (!res.ok) return [];
    const { data } = await res.json();
    if (!data || data.length === 0) return [];

    return data.map((s: { id: string; name: string; short_name?: string }) => ({
      id: s.id,
      name: s.name,
      shortName: s.short_name ?? s.name,
    }));
  } catch {
    return [];
  }
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
