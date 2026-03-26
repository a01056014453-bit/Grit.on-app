import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

// song_analyses.user_id가 database.ts에 미반영되어 타입 보강
type SongAnalysisRow = {
  id: string;
  composer: string;
  title: string;
  created_at: string | null;
  difficulty_level: string | null;
  key: string | null;
  user_id: string | null;
};

/**
 * GET /api/song-analysis/list
 * 인증 사용자: 본인 분석(user_id) + 공개 분석(user_id=null)
 * 비인증 사용자: 공개 분석만
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인 (optional)
    let userId: string | null = null;
    try {
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
      userId = user?.id ?? null;
    } catch { /* 비인증 허용 */ }

    // user_id 컬럼이 database.ts 미반영 → 타입 단언 필요
    const query = supabaseServer
      .from("song_analyses")
      .select("id, composer, title, created_at, difficulty_level, key, user_id" as "id")
      .order("created_at", { ascending: false })
      .limit(100);

    // user_id 기반 필터: 본인 + 공개
    if (userId) {
      query.or(`user_id.eq.${userId},user_id.is.null`);
    } else {
      query.is("user_id" as "id", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[song-analysis/list] DB 조회 실패:", error.message);
      return NextResponse.json(
        { error: "분석 목록을 불러올 수 없습니다" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: (data as unknown as SongAnalysisRow[] | null) ?? [],
    });
  } catch (err) {
    console.error("[song-analysis/list] 서버 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
