import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { sendSlackNotification, dailyReportMessage } from "@/lib/slack";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

/**
 * GET /api/cron/daily-report
 * Vercel Cron으로 매일 09:00 KST 실행
 * Slack + (선택) Google Sheets에 일일 리포트 발송
 */
export async function GET(request: NextRequest) {
  // Cron 인증
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const yesterday = new Date(now.getTime() + kstOffset - 24 * 60 * 60 * 1000);
    const dateStr = yesterday.toISOString().split("T")[0];

    // 통계 수집
    const [
      { count: totalUsers },
      { count: newSignups },
      { data: rankings },
      { data: sessions },
      { count: feedbackRequests },
      { count: feedbackCompleted },
    ] = await Promise.all([
      db.from("profiles").select("*", { count: "exact", head: true }),
      db.from("profiles").select("*", { count: "exact", head: true })
        .gte("created_at", `${dateStr}T00:00:00`)
        .lte("created_at", `${dateStr}T23:59:59`),
      db.from("daily_rankings").select("user_id").eq("date", dateStr),
      db.from("practice_sessions").select("practice_time")
        .gte("start_time", `${dateStr}T00:00:00`)
        .lte("start_time", `${dateStr}T23:59:59`),
      db.from("feedback_requests").select("*", { count: "exact", head: true })
        .gte("created_at", `${dateStr}T00:00:00`)
        .lte("created_at", `${dateStr}T23:59:59`),
      db.from("feedback_requests").select("*", { count: "exact", head: true })
        .eq("status", "COMPLETED")
        .gte("completed_at", `${dateStr}T00:00:00`)
        .lte("completed_at", `${dateStr}T23:59:59`),
    ]);

    const totalPracticeMinutes = (sessions ?? []).reduce(
      (sum: number, s: { practice_time: number }) => sum + Math.round(s.practice_time / 60),
      0,
    );

    const stats = {
      date: dateStr,
      dau: rankings?.length ?? 0,
      newSignups: newSignups ?? 0,
      totalUsers: totalUsers ?? 0,
      totalPracticeMinutes,
      feedbackRequests: feedbackRequests ?? 0,
      feedbackCompleted: feedbackCompleted ?? 0,
    };

    // Slack 발송
    await sendSlackNotification("growth", dailyReportMessage(stats));

    // Google Sheets 기록 (설정된 경우)
    const sheetsWebhook = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (sheetsWebhook) {
      await fetch(sheetsWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stats),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, stats });
  } catch (err) {
    console.error("[cron/daily-report]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
