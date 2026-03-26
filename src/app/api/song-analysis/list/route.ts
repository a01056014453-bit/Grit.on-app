import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";
import type { SongAnalysisPublic } from "@/types/song-analysis";

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

    // user_id가 database.ts에 미반영 → select 타입 단언
    let query = supabaseServer
      .from("song_analyses")
      .select("id, composer, title, created_at, difficulty_level, key, user_id" as "id")
      .order("created_at", { ascending: false })
      .limit(100);

    // user_id 기반 RLS 필터: 본인 + 공개
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    } else {
      query = query.is("user_id" as "id", null);
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
      data: (data as unknown as SongAnalysisPublic[]) ?? [],
    });
  } catch (err) {
    console.error("[song-analysis/list] 서버 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
