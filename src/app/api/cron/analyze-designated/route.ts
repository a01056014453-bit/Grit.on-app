import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { sendSlackNotification } from "@/lib/slack";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

export const maxDuration = 300;

/**
 * GET /api/cron/analyze-designated
 * 학교 지정곡 중 미분석 곡 자동 분석
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 지정곡 목록 조회
    const { data: pieces } = await db
      .from("designated_pieces")
      .select("id, composer, title, full_name");

    if (!pieces || pieces.length === 0) {
      return NextResponse.json({ success: true, message: "지정곡 없음" });
    }

    // 이미 분석된 곡 확인
    const { data: existing } = await db
      .from("song_analyses")
      .select("composer, title");

    const existingList = (existing ?? []) as { composer: string; title: string }[];

    const unanalyzed = pieces.filter((p: any) => {
      const lastName = (p.composer as string).toLowerCase().split(" ").pop() ?? "";
      const titleFirst = (p.title as string).toLowerCase().split(/[\s,]+/)[0] ?? "";
      return !existingList.some(
        (e) => e.composer.toLowerCase().includes(lastName) && e.title.toLowerCase().includes(titleFirst),
      );
    });

    // 최대 2곡씩 분석
    const batch = unanalyzed.slice(0, 2);

    const results: { title: string; success: boolean }[] = [];

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
            title: piece.full_name || piece.title,
            useV2: true,
          }),
        });
        const data = await res.json();
        results.push({ title: `${piece.composer} - ${piece.title}`, success: data.success === true });
      } catch {
        results.push({ title: `${piece.composer} - ${piece.title}`, success: false });
      }
    }

    if (results.length > 0) {
      await sendSlackNotification("general", {
        text: `📚 지정곡 분석: ${results.filter((r) => r.success).length}/${results.length}곡 완료`,
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("[cron/analyze-designated]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
