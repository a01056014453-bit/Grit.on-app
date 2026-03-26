import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/song-analysis/list
 * DB에 저장된 모든 분석 목록 반환 (id, composer, title, created_at)
 */
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("song_analyses")
      .select("id, composer, title, created_at, difficulty_level, key")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
