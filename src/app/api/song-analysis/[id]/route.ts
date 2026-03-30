import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";
import type { SongAnalysis } from "@/types/song-analysis";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabaseServer as any;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(_request.url);
  const composer = url.searchParams.get("composer");
  const title = url.searchParams.get("title");

  // 인증 확인
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return _request.headers.get("cookie")
            ? _request.headers.get("cookie")!.split("; ").map((c) => {
                const [name, ...rest] = c.split("=");
                return { name, value: rest.join("=") };
              })
            : [];
        },
        setAll() {},
      },
    },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // song_analyses는 공유 캐시 — 로그인 사용자면 모든 분석 접근 가능
  // (user_analysis_history는 보관함 목록용이지 접근 제어용이 아님)

  // 1. id로 공유 캐시에서 검색
  let { data, error } = await supabaseServer
    .from("song_analyses")
    .select("*")
    .eq("id", id)
    .single();

  // 2. id로 못 찾으면 composer+title로 재검색 (공유 캐시)
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
    return NextResponse.json({ error: "분석 데이터를 찾을 수 없습니다" }, { status: 404 });
  }

  // content에 전체 SongAnalysis가 저장되어 있으면 복원
  const content = data.content as Record<string, unknown>;
  let analysis: SongAnalysis;

  if (content && content.meta && content.content) {
    analysis = content as unknown as SongAnalysis;
    analysis.id = data.id;
    analysis.created_at = data.created_at || analysis.created_at;
    analysis.updated_at = data.updated_at || analysis.updated_at;
  } else {
    analysis = {
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
    };
  }

  return NextResponse.json(analysis);
}
