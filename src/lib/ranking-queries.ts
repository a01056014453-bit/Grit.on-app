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

/** 유저가 가입한 학교 목록 조회 */
export async function fetchUserSchools(userId: string): Promise<SchoolOption[]> {
  try {
    const res = await fetch(`/api/db/query?table=room_memberships&filter=user_id.eq.${userId}&limit=50`);
    if (!res.ok) return [];
    const { data: memberships } = await res.json();
    if (!memberships || memberships.length === 0) return [];

    // room_id로 rooms 조회해서 school_id 가져오기
    const roomIds = memberships.map((m: { room_id: string }) => m.room_id);
    const schoolIds = new Set<string>();
    const schools: SchoolOption[] = [];

    for (const roomId of roomIds) {
      const roomRes = await fetch(`/api/db/query?table=rooms&filter=id.eq.${roomId}&limit=1`);
      if (!roomRes.ok) continue;
      const { data: rooms } = await roomRes.json();
      if (!rooms || rooms.length === 0) continue;

      const schoolId = rooms[0].school_id;
      if (schoolId && !schoolIds.has(schoolId)) {
        schoolIds.add(schoolId);
        const schoolRes = await fetch(`/api/db/query?table=schools&filter=id.eq.${schoolId}&limit=1`);
        if (!schoolRes.ok) continue;
        const { data: schoolData } = await schoolRes.json();
        if (schoolData && schoolData.length > 0) {
          schools.push({
            id: schoolData[0].id,
            name: schoolData[0].name,
            shortName: schoolData[0].short_name ?? schoolData[0].name,
          });
        }
      }
    }

    return schools;
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
