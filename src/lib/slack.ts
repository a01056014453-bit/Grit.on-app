/**
 * Slack Incoming Webhook 알림 발송
 *
 * 환경변수:
 * - SLACK_WEBHOOK_GENERAL: 일반 알림 (#sempre-alerts)
 * - SLACK_WEBHOOK_TEACHER: 선생님 인증 (#teacher-review)
 * - SLACK_WEBHOOK_GROWTH: 성장 지표 (#growth)
 * - SLACK_WEBHOOK_ERRORS: 에러 (#errors)
 */

type SlackChannel = "general" | "teacher" | "growth" | "errors";

const WEBHOOK_MAP: Record<SlackChannel, string> = {
  general: "SLACK_WEBHOOK_GENERAL",
  teacher: "SLACK_WEBHOOK_TEACHER",
  growth: "SLACK_WEBHOOK_GROWTH",
  errors: "SLACK_WEBHOOK_ERRORS",
};

interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

interface SlackBlock {
  type: "section" | "divider" | "header" | "actions" | "context";
  text?: { type: "mrkdwn" | "plain_text"; text: string };
  fields?: { type: "mrkdwn" | "plain_text"; text: string }[];
  elements?: unknown[];
  accessory?: unknown;
}

export async function sendSlackNotification(
  channel: SlackChannel,
  message: SlackMessage,
): Promise<boolean> {
  const envKey = WEBHOOK_MAP[channel];
  const webhookUrl = process.env[envKey];

  if (!webhookUrl) {
    // fallback: 일반 채널로 시도
    const fallback = process.env.SLACK_WEBHOOK_GENERAL;
    if (!fallback) {
      console.warn(`[slack] ${envKey} 미설정, 알림 건너뜀`);
      return false;
    }
    return doSend(fallback, message);
  }

  return doSend(webhookUrl, message);
}

async function doSend(url: string, message: SlackMessage): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    return res.ok;
  } catch (err) {
    console.error("[slack] 발송 실패:", err);
    return false;
  }
}

// ─── 미리 만든 메시지 템플릿 ───

export function teacherVerificationMessage(name: string, specialty: string[], teacherId: string) {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://withsempre.com"}/admin/experts`;
  return {
    text: `새 선생님 인증 신청: ${name}`,
    blocks: [
      {
        type: "header" as const,
        text: { type: "plain_text" as const, text: "📋 새 선생님 인증 신청" },
      },
      {
        type: "section" as const,
        fields: [
          { type: "mrkdwn" as const, text: `*이름:*\n${name}` },
          { type: "mrkdwn" as const, text: `*전공:*\n${specialty.join(", ")}` },
        ],
      },
      {
        type: "actions" as const,
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "심사하기" },
            url: adminUrl,
            style: "primary",
          },
        ],
      },
    ],
  };
}

export function newSignupMessage(nickname: string, instrument: string, totalUsers: number) {
  return {
    text: `새 가입: ${nickname} (${instrument}) — 총 ${totalUsers}명`,
    blocks: [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `👋 *새 가입*: ${nickname} (${instrument})\n총 사용자: *${totalUsers}명*`,
        },
      },
    ],
  };
}

export function feedbackSlaMessage(requestId: string, teacherName: string, hoursLeft: number) {
  const inboxUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://withsempre.com"}/inbox/${requestId}`;
  return {
    text: `⏰ 피드백 수락 마감 ${hoursLeft}시간 전: ${teacherName}`,
    blocks: [
      {
        type: "section" as const,
        text: {
          type: "mrkdwn" as const,
          text: `⏰ *피드백 수락 마감 ${hoursLeft}시간 전*\n선생님: ${teacherName}\n<${inboxUrl}|요청 보기>`,
        },
      },
    ],
  };
}

export function dailyReportMessage(stats: {
  dau: number;
  newSignups: number;
  totalUsers: number;
  totalPracticeMinutes: number;
  feedbackRequests: number;
  feedbackCompleted: number;
  date: string;
}) {
  return {
    text: `📊 일일 리포트 (${stats.date})`,
    blocks: [
      {
        type: "header" as const,
        text: { type: "plain_text" as const, text: `📊 일일 리포트 — ${stats.date}` },
      },
      {
        type: "section" as const,
        fields: [
          { type: "mrkdwn" as const, text: `*DAU:*\n${stats.dau}명` },
          { type: "mrkdwn" as const, text: `*신규 가입:*\n${stats.newSignups}명` },
          { type: "mrkdwn" as const, text: `*총 사용자:*\n${stats.totalUsers}명` },
          { type: "mrkdwn" as const, text: `*총 연습:*\n${Math.round(stats.totalPracticeMinutes / 60)}시간` },
          { type: "mrkdwn" as const, text: `*피드백 요청:*\n${stats.feedbackRequests}건` },
          { type: "mrkdwn" as const, text: `*피드백 완료:*\n${stats.feedbackCompleted}건` },
        ],
      },
    ],
  };
}
