import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";
import type { SongAnalysisPublic } from "@/types/song-analysis";

/** API 응답 스키마 */
const songAnalysisItemSchema = z.object({
  id: z.string(),
  composer: z.string(),
  title: z.string(),
  created_at: z.string().nullable(),
  difficulty_level: z.string().nullable(),
  key: z.string().nullable(),
  user_id: z.string().nullable(),
});

type SongAnalysisListResponse =
  | { data: SongAnalysisPublic[] }
  | { error: string };

/**
 * GET /api/song-analysis/list
 * 인증 필수 — 해당 사용자의 분석 목록만 반환
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

    // 본인 분석 목록만 조회 (user_id 필터)
    const { data, error } = await supabaseServer
      .from("song_analyses")
      .select("id, composer, title, created_at, difficulty_level, key, user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[song-analysis/list] DB 조회 실패:", error.message);
      return NextResponse.json(
        { error: "분석 목록을 불러올 수 없습니다" },
        { status: 500 },
      );
    }

    // Zod로 응답 데이터 검증
    const validated = z.array(songAnalysisItemSchema).safeParse(data ?? []);
    if (!validated.success) {
      console.error("[song-analysis/list] 응답 검증 실패:", validated.error.message);
      return NextResponse.json(
        { error: "데이터 형식 오류가 발생했습니다" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: validated.data });
  } catch (err) {
    console.error("[song-analysis/list] 서버 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
