import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getAllCachedAnalyses } from "@/lib/song-analysis-db";

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

    const analyses = await getAllCachedAnalyses(user.id);

    // 클라이언트에 필요한 정보만 반환
    const simplified = analyses.map((a) => ({
      id: a.id,
      composer: a.meta.composer,
      title: a.meta.title,
      difficulty: a.meta.difficulty_level,
      updatedAt: a.updated_at,
    }));

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
