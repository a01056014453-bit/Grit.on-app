import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/cron/morning-brief
 * Vercel Cron (매일 23:00 UTC = 08:00 KST)
 * Slack으로 일일 운영 리포트 전송
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "인증 필요" }, { status: 401 });
    }

    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!slackWebhookUrl) {
      return NextResponse.json({ error: "SLACK_WEBHOOK_URL 미설정" }, { status: 500 });
    }

    // KST 기준 어제 날짜
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const yesterday = new Date(kst);
    yesterday.setDate(kst.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // 1. 전체 유저 수
    const { count: totalUsers } = await supabaseServer
      .from("profiles")
      .select("id", { count: "exact", head: true });

    // 2. 어제 신규 가입
    const { count: newUsers } = await supabaseServer
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${yesterdayStr}T00:00:00`)
      .lt("created_at", `${yesterdayStr}T23:59:59`);

    // 3. 어제 DAU (연습한 사람)
    const { count: dau } = await supabaseServer
      .from("daily_rankings")
      .select("user_id", { count: "exact", head: true })
      .eq("date", yesterdayStr)
      .gt("net_practice_time", 0);

    // 4. 선생님 인증 대기
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: pendingTeachers } = await (supabaseServer as any)
      .from("teachers")
      .select("id", { count: "exact", head: true })
      .eq("verified", false);

    // 5. 피드백 요청 대기
    const { count: pendingFeedback } = await supabaseServer
      .from("feedback_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "SENT");

    // Slack 메시지 구성
    const blocks = [
      {
        type: "header",
        text: { type: "plain_text", text: `📊 SEMPRE 모닝 브리프 (${yesterdayStr})` },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*전체 유저*\n${totalUsers ?? 0}명` },
          { type: "mrkdwn", text: `*어제 신규*\n+${newUsers ?? 0}명` },
          { type: "mrkdwn", text: `*어제 DAU*\n${dau ?? 0}명` },
          { type: "mrkdwn", text: `*WAU 비율*\n${totalUsers ? Math.round(((dau ?? 0) / totalUsers) * 100) : 0}%` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            (pendingTeachers ?? 0) > 0 ? `🔴 *선생님 인증 대기*: ${pendingTeachers}건` : "✅ 선생님 인증 대기 없음",
            (pendingFeedback ?? 0) > 0 ? `🟡 *피드백 요청 대기*: ${pendingFeedback}건` : "✅ 피드백 요청 대기 없음",
          ].join("\n"),
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "어드민 열기" },
            url: process.env.NEXT_PUBLIC_APP_URL
              ? `${process.env.NEXT_PUBLIC_APP_URL}/admin`
              : "https://griton-app.vercel.app/admin",
          },
        ],
      },
    ];

    await fetch(slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });

    return NextResponse.json({
      success: true,
      stats: { totalUsers, newUsers, dau, pendingTeachers, pendingFeedback },
    });
  } catch (err) {
    console.error("[morning-brief] error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
