import { NextResponse } from "next/server";
import { getAllCachedAnalyses } from "@/lib/song-analysis-db";

export async function GET() {
  try {
    const analyses = await getAllCachedAnalyses();

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
      { success: false, error: "Failed to get analyses" },
      { status: 500 }
    );
  }
}
