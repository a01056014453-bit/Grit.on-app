import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/song-analysis/list
 * 본인이 분석한 곡 목록만 반환 (user_id 기반)
 * user_id가 없는 기존 데이터는 전체 반환 (마이그레이션 전)
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseServer as any;

    let data;
    if (user) {
      // 본인 분석 + user_id가 null인 기존 분석 (마이그레이션 전 데이터)
      const { data: userAnalyses } = await db
        .from("song_analyses")
        .select("id, composer, title, created_at, difficulty_level, key, user_id")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order("created_at", { ascending: false })
        .limit(50);
      data = userAnalyses;
    } else {
      // 비인증: 빈 배열
      data = [];
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
