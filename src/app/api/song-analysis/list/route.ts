import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

type SongAnalysisListItem = {
  id: string;
  composer: string;
  title: string;
  created_at: string | null;
  difficulty_level: string | null;
  key: string | null;
};

type SongAnalysisListResponse =
  | { data: SongAnalysisListItem[] }
  | { error: string };

/**
 * GET /api/song-analysis/list
 * 인증 필수 — 전체 분석 목록 반환 (공유 캐시)
 * "내 보관함" 필터링은 프론트엔드에서 처리
 */
export async function GET(request: NextRequest): Promise<NextResponse<SongAnalysisListResponse>> {
  try {
    // 인증 확인
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
      },
    );
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 },
      );
    }

    // song_analyses 전체에서 조회 (공유 캐시)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseServer as any)
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
