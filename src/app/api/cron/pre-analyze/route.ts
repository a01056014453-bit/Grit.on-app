import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { POPULAR_PIECES } from "@/lib/data/popular-pieces";
import { sendSlackNotification } from "@/lib/slack";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

export const maxDuration = 300; // 5분 (분석에 시간 걸림)

/**
 * GET /api/cron/pre-analyze
 * Vercel Cron으로 매일 실행 — 미분석 인기곡 3곡씩 자동 분석
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. 이미 분석된 곡 목록 조회
    const { data: existingAnalyses } = await db
      .from("song_analyses")
      .select("composer, title");

    const existingList = (existingAnalyses ?? []) as { composer: string; title: string }[];
    const analyzedKeys = existingList.map(
      (a) => `${a.composer.toLowerCase().trim()}__${a.title.toLowerCase().trim()}`,
    );

    // 2. 미분석 곡 찾기
    const unanalyzed = POPULAR_PIECES.filter((piece) => {
      const key = `${piece.composer.toLowerCase().trim()}__${piece.title.toLowerCase().trim()}`;
      if (analyzedKeys.includes(key)) return false;
      // 부분 매칭도 체크
      const lastName = piece.composer.toLowerCase().split(" ").pop() ?? "";
      const titleWords = piece.title.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 3);
      const hasPartialMatch = existingList.some((e) =>
        e.composer.toLowerCase().includes(lastName) &&
        titleWords.some((word) => e.title.toLowerCase().includes(word)),
      );
      return !hasPartialMatch;
    });

    if (unanalyzed.length === 0) {
      await sendSlackNotification("general", {
        text: `✅ 사전 분석 완료: 모든 인기곡 ${POPULAR_PIECES.length}곡이 분석되었습니다.`,
      });
      return NextResponse.json({
        success: true,
        message: "모든 인기곡 분석 완료",
        total: POPULAR_PIECES.length,
        remaining: 0,
      });
    }

    // 3. 상위 3곡 분석 (입시 > 콩쿠르 > 레슨 > 교양 우선)
    const priorityOrder = { "입시": 0, "콩쿠르": 1, "레슨": 2, "교양": 3 };
    const sorted = unanalyzed.sort(
      (a, b) => priorityOrder[a.category] - priorityOrder[b.category],
    );
    const batch = sorted.slice(0, 3);

    const results: { composer: string; title: string; success: boolean; error?: string }[] = [];

    for (const piece of batch) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://withsempre.com";
        const res = await fetch(`${appUrl}/api/analyze-song-v2`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cronSecret}`,
          },
          body: JSON.stringify({
            composer: piece.composer,
            title: piece.title,
            instrument: piece.instrument,
            useV2: true,
          }),
        });

        const data = await res.json();
        results.push({
          composer: piece.composer,
          title: piece.title,
          success: data.success === true,
          error: data.error,
        });
      } catch (err) {
        results.push({
          composer: piece.composer,
          title: piece.title,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    // 4. Slack 알림
    await sendSlackNotification("general", {
      text: `🎵 사전 분석 완료: ${successCount}/${batch.length}곡 성공 (남은 곡: ${unanalyzed.length - batch.length}곡)`,
      blocks: [
        {
          type: "header" as const,
          text: { type: "plain_text" as const, text: "🎵 사전 분석 리포트" },
        },
        {
          type: "section" as const,
          fields: results.map((r) => ({
            type: "mrkdwn" as const,
            text: `${r.success ? "✅" : "❌"} ${r.composer} - ${r.title.slice(0, 30)}${r.error ? `\n_${r.error.slice(0, 50)}_` : ""}`,
          })),
        },
        {
          type: "context" as const,
          elements: [
            {
              type: "mrkdwn" as const,
              text: `전체 ${POPULAR_PIECES.length}곡 중 ${POPULAR_PIECES.length - unanalyzed.length + successCount}곡 완료 | 남은 곡: ${unanalyzed.length - successCount}곡`,
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      success: true,
      analyzed: results,
      remaining: unanalyzed.length - successCount,
      total: POPULAR_PIECES.length,
    });
  } catch (err) {
    console.error("[cron/pre-analyze]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
