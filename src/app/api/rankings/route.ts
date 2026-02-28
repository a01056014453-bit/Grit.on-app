import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const today = new Date().toISOString().split("T")[0];

    // 전체 랭킹 조회
    const { data: rankings, error: rankingsError } = await supabaseServer
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

    if (rankingsError) {
      console.error("[rankings] 조회 실패:", rankingsError);
      return NextResponse.json(
        { error: "랭킹 데이터를 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    const rankers = (rankings ?? []).map(
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
    if (userId) {
      // 닉네임이 전달된 경우 프로필 업데이트
      if (nickname && nickname !== "연습생" && nickname !== "익명" && nickname !== "사용자") {
        await supabaseServer
          .from("profiles")
          .update({ nickname })
          .eq("id", userId);

        // 전체 랭커 목록에서도 본인 닉네임 반영
        const myInAll = rankers.find((r: { id: string }) => r.id === userId);
        if (myInAll) {
          myInAll.nickname = nickname;
        }
      }

      const myIndex = rankers.findIndex(
        (r: { id: string }) => r.id === userId
      );
      if (myIndex !== -1) {
        myRanking = rankers[myIndex];
      }
    }

    return NextResponse.json({ rankers, myRanking });
  } catch (error) {
    console.error("[rankings] 서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
