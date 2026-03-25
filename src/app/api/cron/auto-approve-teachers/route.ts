import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

/**
 * GET /api/cron/auto-approve-teachers
 * Vercel Cron (매시간)
 *
 * AI 심사 결과가 likely_valid + confidence >= 0.85인 선생님을 자동 승인
 * 나머지는 Slack 알림으로 수동 처리 유도
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "인증 필요" }, { status: 401 });
    }

    // 미승인 선생님 조회
    const { data: pendingTeachers, error } = await db
      .from("teachers")
      .select("id, user_id, name, ai_review")
      .eq("verified", false);

    if (error || !pendingTeachers) {
      return NextResponse.json({ success: true, autoApproved: 0, needsReview: 0 });
    }

    let autoApproved = 0;
    let needsReview = 0;

    for (const teacher of pendingTeachers) {
      const aiReview = teacher.ai_review as {
        verdict?: string;
        confidence?: number;
      } | null;

      if (
        aiReview?.verdict === "likely_valid" &&
        typeof aiReview.confidence === "number" &&
        aiReview.confidence >= 0.85
      ) {
        // 자동 승인
        await db
          .from("teachers")
          .update({ verified: true, updated_at: new Date().toISOString() })
          .eq("id", teacher.id);

        autoApproved++;
        console.log(`[AutoApprove] ${teacher.name} 자동 승인 (confidence: ${aiReview.confidence})`);
      } else {
        needsReview++;
      }
    }

    // 수동 처리 필요한 건이 있으면 Slack 알림
    if (needsReview > 0) {
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (slackWebhookUrl) {
        await fetch(slackWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🔔 선생님 인증 수동 처리 필요: ${needsReview}건\n자동 승인: ${autoApproved}건\n<${process.env.NEXT_PUBLIC_APP_URL || "https://griton-app.vercel.app"}/admin/experts|어드민에서 확인>`,
          }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, autoApproved, needsReview });
  } catch (err) {
    console.error("[auto-approve] error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
