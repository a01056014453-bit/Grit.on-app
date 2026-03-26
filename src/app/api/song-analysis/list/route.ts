import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getUserAnalysisHistory } from "@/lib/song-analysis-db";

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
 * 인증 필수 — 해당 사용자의 개인 보관함 목록 반환
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

    // 개인 보관함에서 조회 (user_analysis_history 기반)
    const analyses = await getUserAnalysisHistory(user.id);

    const data: SongAnalysisListItem[] = analyses.map((a) => ({
      id: a.id,
      composer: a.meta.composer,
      title: a.meta.title,
      created_at: a.created_at ?? null,
      difficulty_level: a.meta.difficulty_level ?? null,
      key: a.meta.key ?? null,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[song-analysis/list] 서버 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
