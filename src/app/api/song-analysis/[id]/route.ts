import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import type { SongAnalysis } from "@/types/song-analysis";
import type { SongAnalysisV3 } from "@/types/song-analysis";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(_request.url);
    const composer = url.searchParams.get("composer");
    const title = url.searchParams.get("title");

    // 1. id로 공유 캐시에서 검색 (인증 불필요 — 공유 캐시)
    let { data, error } = await supabaseServer
      .from("song_analyses")
      .select("*")
      .eq("id", id)
      .single();

    // 2. id로 못 찾으면 composer+title로 재검색
    if ((error || !data) && composer && title) {
      const { data: fallback } = await supabaseServer
        .from("song_analyses")
        .select("*")
        .ilike("composer", `%${composer}%`)
        .ilike("title", `%${title}%`)
        .limit(1)
        .single();
      if (fallback) {
        data = fallback;
        error = null;
      }
    }

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "분석 데이터를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // content에서 복원
    const content = data.content as Record<string, unknown>;

    if (content && content.meta && content.content) {
      // V3 감지: schema_version === 3
      const schemaVer = content.schema_version;
      if (schemaVer === 3) {
        // V3는 이중 래핑될 수 있음: content.content가 SongAnalysisV3, content.content.content가 AnalysisContentV3
        const inner = content.content as Record<string, unknown>;

        // 케이스 1: content.content.content에 work_type이 있음 (이중 래핑)
        if (inner && inner.content && typeof inner.content === "object") {
          const deepContent = inner.content as Record<string, unknown>;
          if ("work_type" in deepContent) {
            // inner가 실제 SongAnalysisV3
            const v3 = inner as unknown as SongAnalysisV3;
            return NextResponse.json({
              ...v3,
              id: data.id,
              created_at: data.created_at || v3.created_at,
              updated_at: data.updated_at || v3.updated_at,
            });
          }
        }

        // 케이스 2: content.content에 직접 work_type이 있음 (단일 래핑)
        if ("work_type" in inner) {
          const v3 = content as unknown as SongAnalysisV3;
          return NextResponse.json({
            ...v3,
            id: data.id,
            created_at: data.created_at || v3.created_at,
            updated_at: data.updated_at || v3.updated_at,
          });
        }
      }

      // V1/V2 복원
      const analysis = content as unknown as SongAnalysis;
      analysis.id = data.id;
      analysis.created_at = data.created_at || analysis.created_at;
      analysis.updated_at = data.updated_at || analysis.updated_at;
      return NextResponse.json(analysis);
    }

    // content가 래퍼가 아닌 경우 (구형 데이터)
    return NextResponse.json({
      id: data.id,
      meta: {
        composer: data.composer,
        title: data.title,
        opus: data.opus || "",
        key: data.key || "",
        difficulty_level: (data.difficulty_level as SongAnalysis["meta"]["difficulty_level"]) || "Intermediate",
      },
      content: content as unknown as SongAnalysis["content"],
      verification_status: (data.verification_status as SongAnalysis["verification_status"]) || "Needs Review",
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      schema_version: 1,
    });
  } catch (err) {
    console.error("[song-analysis/:id] GET error:", err);
    return NextResponse.json(
      { success: false, error: "분석 데이터를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
