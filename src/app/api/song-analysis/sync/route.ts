import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";
import { addToUserHistory } from "@/lib/song-analysis-db";

interface SyncRequestBody {
  analysisIds?: string[];
  composerTitlePairs?: { composer: string; title: string }[];
}

interface SyncResponse {
  success: boolean;
  synced: number;
  error?: string;
}

/**
 * POST /api/song-analysis/sync
 * localStorage 데이터를 user_analysis_history에 동기화
 * 인증 필수
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<SyncResponse>> {
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
        { success: false, synced: 0, error: "로그인이 필요합니다" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as SyncRequestBody;
    const { analysisIds = [], composerTitlePairs = [] } = body;

    if (analysisIds.length === 0 && composerTitlePairs.length === 0) {
      return NextResponse.json({ success: true, synced: 0 });
    }

    const matchedIds = new Set<string>();

    // 1) ID 기반 매칭 — song_analyses 테이블에 존재하는지 확인
    if (analysisIds.length > 0) {
      const { data: idMatches } = await supabaseServer
        .from("song_analyses")
        .select("id")
        .in("id", analysisIds);

      if (idMatches) {
        for (const row of idMatches) {
          matchedIds.add(row.id);
        }
      }
    }

    // 2) composer+title 기반 매칭
    for (const pair of composerTitlePairs) {
      const composer = pair.composer.trim();
      const title = pair.title.trim();
      if (!composer || !title) continue;

      const { data: titleMatches } = await supabaseServer
        .from("song_analyses")
        .select("id")
        .ilike("composer", `%${composer}%`)
        .ilike("title", `%${title}%`)
        .limit(1);

      if (titleMatches && titleMatches.length > 0) {
        matchedIds.add(titleMatches[0].id);
      }
    }

    // 3) user_analysis_history에 upsert
    let synced = 0;
    for (const songAnalysisId of matchedIds) {
      await addToUserHistory(user.id, songAnalysisId);
      synced += 1;
    }

    return NextResponse.json({ success: true, synced });
  } catch (err) {
    console.error("[song-analysis/sync] 서버 오류:", err);
    return NextResponse.json(
      { success: false, synced: 0, error: "동기화 중 서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
