import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/song-analysis/list
 * 분석 목록 반환 — 현재는 전체, 추후 user_id 기반 필터 전환
 */
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("song_analyses")
      .select("id, composer, title, created_at, difficulty_level, key")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[song-analysis/list] error:", error.message);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
