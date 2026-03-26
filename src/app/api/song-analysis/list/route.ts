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
 * 인증 필수 — 전체 분석 목록 반환 (공유 캐시)
 * "내 보관함" 필터링은 프론트엔드 localStorage에서 처리
 *
 * song_analyses는 공유 캐시: 사용자 A가 분석한 곡을 B가 요청하면
 * 캐시 히트로 같은 레코드를 사용. user_id는 최초 분석자만 기록되므로
 * 서버에서 user_id 필터링하면 다른 사용자에게 안 보이는 버그 발생.
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

    // 전체 분석 목록 (공유 캐시 — user_id 필터 없음)
    const { data, error } = await supabaseServer
      .from("song_analyses")
      .select("id, composer, title, created_at, difficulty_level, key, user_id")
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
