import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/cron/dev-report
 * Vercel Cron (매일 00:00 UTC = 09:00 KST)
 *
 * 전날 개발 변경사항 + 오류 리포트를 Slack으로 전송
 * - GitHub 커밋 목록
 * - Vercel 배포 상태
 * - API 에러 요약
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

    // 전날 날짜 범위 (UTC)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const sinceISO = yesterday.toISOString();
    const dateStr = yesterday.toISOString().slice(0, 10);

    // ─── 1. GitHub 커밋 목록 ───
    let commits: { message: string; author: string; time: string }[] = [];
    const ghToken = process.env.GITHUB_TOKEN;
    const ghRepo = "a01056014453-bit/Grit.on-app";

    if (ghToken) {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${ghRepo}/commits?since=${sinceISO}&per_page=20`,
          { headers: { Authorization: `Bearer ${ghToken}`, Accept: "application/vnd.github.v3+json" } },
        );
        if (res.ok) {
          const data = await res.json();
          commits = data.map((c: { commit: { message: string; author: { name: string; date: string } } }) => ({
            message: c.commit.message.split("\n")[0], // 첫 줄만
            author: c.commit.author.name,
            time: c.commit.author.date,
          }));
        }
      } catch { /* GitHub API 실패 무시 */ }
    }

    // ─── 2. Vercel 배포 상태 ───
    let deployStatus = "확인 불가";
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;

    if (vercelToken && vercelProjectId) {
      try {
        const res = await fetch(
          `https://api.vercel.com/v6/deployments?projectId=${vercelProjectId}&limit=3`,
          { headers: { Authorization: `Bearer ${vercelToken}` } },
        );
        if (res.ok) {
          const data = await res.json();
          const latest = data.deployments?.[0];
          if (latest) {
            const stateEmoji: Record<string, string> = {
              READY: "✅", ERROR: "❌", BUILDING: "🔨", QUEUED: "⏳", CANCELED: "⛔",
            };
            deployStatus = `${stateEmoji[latest.state] || "❓"} ${latest.state} (${new Date(latest.created).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })})`;
          }
        }
      } catch { /* Vercel API 실패 무시 */ }
    } else {
      deployStatus = "VERCEL_TOKEN 미설정";
    }

    // ─── 3. 주요 API 에러 체크 (간이 헬스체크) ───
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://griton-app.vercel.app";
    const endpoints = [
      { name: "랭킹 API", url: `${appUrl}/api/rankings` },
      { name: "메인 페이지", url: appUrl },
    ];

    const healthResults: { name: string; status: string }[] = [];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url, { method: "GET" });
        healthResults.push({
          name: ep.name,
          status: res.ok ? `✅ ${res.status}` : `❌ ${res.status}`,
        });
      } catch {
        healthResults.push({ name: ep.name, status: "❌ 연결 실패" });
      }
    }

    // ─── Slack 메시지 구성 ───
    const commitSection = commits.length > 0
      ? commits.slice(0, 10).map((c) => `• \`${c.message}\``).join("\n")
      : "_전날 커밋 없음_";

    const healthSection = healthResults
      .map((h) => `${h.status} ${h.name}`)
      .join("\n");

    const blocks = [
      {
        type: "header",
        text: { type: "plain_text", text: `🛠 개발 리포트 (${dateStr})` },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📝 전날 커밋 (${commits.length}건)*\n${commitSection}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🚀 배포 상태*\n${deployStatus}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🏥 서비스 헬스체크*\n${healthSection}`,
        },
      },
    ];

    // 에러가 있으면 강조
    const hasError = healthResults.some((h) => h.status.includes("❌"));
    if (hasError) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "⚠️ *서비스 이상 감지!* 확인이 필요합니다.",
        },
      });
    }

    await fetch(slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });

    return NextResponse.json({
      success: true,
      commits: commits.length,
      deploy: deployStatus,
      health: healthResults,
    });
  } catch (err) {
    console.error("[dev-report] error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
