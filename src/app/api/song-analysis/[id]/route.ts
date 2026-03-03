import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import type { SongAnalysis } from "@/types/song-analysis";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseServer
    .from("song_analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
