import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    // 인증 확인 (닉네임 업데이트 보호용)
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    // 인증된 유저 ID (없으면 읽기만 허용)
    const authUserId = user?.id ?? null;

    const { searchParams } = new URL(request.url);
    const filterInstrument = searchParams.get("instrument");
    const filterSchoolId = searchParams.get("schoolId");

    // KST 기준 오늘 날짜
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const today = new Date(now.getTime() + kstOffset).toISOString().split("T")[0];

    // 학교별 필터: 해당 학교 유저 ID 목록 조회
    let schoolUserIds: string[] | null = null;
    if (filterSchoolId) {
      const { data: memberships } = await supabaseServer
        .from("room_memberships")
        .select("user_id, rooms!inner(school_id)")
        .eq("rooms.school_id", filterSchoolId);

      if (memberships) {
        schoolUserIds = [...new Set(memberships.map((m: { user_id: string }) => m.user_id))];
      }
    }

    // 전체 랭킹 조회
    let query = supabaseServer
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

    // 학교 필터 적용
    if (schoolUserIds !== null) {
      if (schoolUserIds.length === 0) {
        return NextResponse.json({ rankers: [], myRanking: null, filter: { type: "school", totalCount: 0 } });
      }
      query = query.in("user_id", schoolUserIds);
    }

    const { data: rankings, error: rankingsError } = await query;

    if (rankingsError) {
      console.error("[rankings] 조회 실패:", rankingsError);
      return NextResponse.json(
        { error: "랭킹 데이터를 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    // 악기 필터는 클라이언트 사이드에서도 가능하지만 서버에서 필터링
    let filteredRankings = rankings ?? [];
    if (filterInstrument) {
      filteredRankings = filteredRankings.filter((row: Record<string, unknown>) => {
        const profiles = row.profiles as { instrument?: string } | null;
        return profiles?.instrument === filterInstrument;
      });
    }

    const rankers = filteredRankings.map(
      (row: Record<string, unknown>, index: number) => {
        const profiles = row.profiles as {
          nickname?: string;
          instrument?: string;
        } | null;
        return {
          id: row.user_id as string,
          nickname: profiles?.nickname || "연습생",
          instrument: profiles?.instrument || "piano",
          netPracticeTime: (row.net_practice_time as number) || 0,
          isPracticing: (row.is_practicing as boolean) || false,
          practiceStartedAt: (row.practice_started_at as string) || undefined,
          currentSong: (row.current_song as string) || undefined,
          gritScore: (row.grit_score as number) || 0,
          rank: index + 1,
        };
      }
    );

    // 닉네임 업데이트 + 내 랭킹 조회
    let myRanking = null;
    const nickname = searchParams.get("nickname");
    if (authUserId) {
      // 인증된 유저만 자기 닉네임 업데이트 가능 (중복 체크 포함)
      if (nickname && nickname !== "연습생" && nickname !== "익명" && nickname !== "사용자") {
        const { count } = await supabaseServer
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("nickname", nickname)
          .neq("id", authUserId);

        if ((count ?? 0) === 0) {
          await supabaseServer
            .from("profiles")
            .update({ nickname })
            .eq("id", authUserId);
        }

        // 전체 랭커 목록에서도 본인 닉네임 반영 (불변 업데이트)
        const myIdx = rankers.findIndex((r: { id: string }) => r.id === authUserId);
        if (myIdx !== -1) {
          rankers[myIdx] = { ...rankers[myIdx], nickname };
        }
      }

      const myIndex = rankers.findIndex(
        (r: { id: string }) => r.id === authUserId
      );
      if (myIndex !== -1) {
        myRanking = rankers[myIndex];
      }
    }

    const filterType = filterSchoolId && filterInstrument ? "school_instrument"
      : filterSchoolId ? "school"
      : filterInstrument ? "instrument"
      : "all";

    return NextResponse.json({
      rankers,
      myRanking,
      filter: {
        type: filterType,
        schoolId: filterSchoolId || undefined,
        instrument: filterInstrument || undefined,
        totalCount: rankers.length,
      },
    });
  } catch (error) {
    console.error("[rankings] 서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
