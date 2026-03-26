import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";
import { POPULAR_PIECES } from "@/lib/data/popular-pieces";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

function getAdminIds(): Set<string> {
  return new Set((process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean));
}

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return !!user && getAdminIds().has(user.id);
}

/** GET /api/admin/pre-analyze-status — 사전 분석 현황 */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: allAnalyses } = await db
    .from("song_analyses")
    .select("id, composer, title, created_at, verification_status");

  const analysisList = (allAnalyses ?? []) as { id: string; composer: string; title: string; created_at: string; verification_status: string }[];

  // 인기곡 매칭
  const matched = POPULAR_PIECES.map((piece) => {
    const lastName = piece.composer.toLowerCase().split(" ").pop() ?? "";
    const titleWords = piece.title.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 3);

    const found = analysisList.find((a) =>
      a.composer.toLowerCase().includes(lastName) &&
      titleWords.some((word) => a.title.toLowerCase().includes(word)),
    );

    return {
      composer: piece.composer,
      title: piece.title,
      category: piece.category,
      analyzed: !!found,
      analysisId: found?.id,
      analyzedAt: found?.created_at,
      verificationStatus: found?.verification_status,
    };
  });

  const analyzedCount = matched.filter((m) => m.analyzed).length;
  const byCategory = {
    입시: { total: 0, done: 0 },
    콩쿠르: { total: 0, done: 0 },
    레슨: { total: 0, done: 0 },
    교양: { total: 0, done: 0 },
  };

  for (const m of matched) {
    byCategory[m.category].total++;
    if (m.analyzed) byCategory[m.category].done++;
  }

  return NextResponse.json({
    total: POPULAR_PIECES.length,
    analyzed: analyzedCount,
    remaining: POPULAR_PIECES.length - analyzedCount,
    progress: Math.round((analyzedCount / POPULAR_PIECES.length) * 100),
    byCategory,
    totalDbAnalyses: analysisList.length,
    pieces: matched,
  });
}
