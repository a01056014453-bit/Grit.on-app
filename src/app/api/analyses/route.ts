import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getUserAnalysisHistory } from "@/lib/song-analysis-db";
import { isSongAnalysisV3 } from "@/types/song-analysis";

export async function GET(request: NextRequest) {
  try {
    // 인증 필수
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {},
        },
      },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다" },
        { status: 401 },
      );
    }

    const analyses = await getUserAnalysisHistory(user.id);

    // 클라이언트에 필요한 정보만 반환 — V3와 legacy 분기
    const simplified = analyses.map((a) => {
      if (isSongAnalysisV3(a)) {
        return {
          id: a.id,
          composer: a.meta.work.composer_display,
          title: a.meta.work.canonical_title,
          updatedAt: a.updated_at,
        };
      }
      return {
        id: a.id,
        composer: a.meta.composer,
        title: a.meta.title,
        updatedAt: a.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: simplified,
      count: simplified.length,
    });
  } catch (error) {
    console.error("Failed to get analyses:", error);
    return NextResponse.json(
      { success: false, error: "분석 목록 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
