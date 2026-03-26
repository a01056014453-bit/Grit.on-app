import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/song-analysis/list
 * 전체 분석 목록 반환 (공개 레퍼런스 데이터)
 * 사용자별 "내 보관함" 필터링은 클라이언트에서 localStorage 기반으로 처리
 */
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseServer as any;

    const { data, error } = await db
      .from("song_analyses")
      .select("id, composer, title, created_at, difficulty_level, key")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[song-analysis/list] DB 조회 실패:", error.message);
      return NextResponse.json(
        { error: "분석 목록을 불러올 수 없습니다" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[song-analysis/list] 서버 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
