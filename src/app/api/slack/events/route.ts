import { NextRequest, NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import Anthropic from '@anthropic-ai/sdk';
import { verifySlackRequest } from '@/lib/slack/verify';
import { AGENTS, parseAgentFromMessage, getAgentListText } from '@/lib/slack/agents';
import { buildSystemPrompt } from '@/lib/slack/prompts';
import { getThreadMessages } from '@/lib/slack/thread-history';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 중복 이벤트 방지 (Slack 재전송 대비)
const processedEvents = new Set<string>();
const MAX_PROCESSED = 500;

function markProcessed(eventId: string): boolean {
  if (processedEvents.has(eventId)) return false;
  if (processedEvents.size > MAX_PROCESSED) processedEvents.clear();
  processedEvents.add(eventId);
  return true;
}

// --- 봇 유저 ID 캐시 ---
let cachedBotUserId: string | null = null;

async function getBotUserId(): Promise<string> {
  if (cachedBotUserId) return cachedBotUserId;
  const auth = await slack.auth.test();
  cachedBotUserId = auth.user_id as string;
  return cachedBotUserId;
}

// =============================================================
// POST /api/slack/events
// =============================================================
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 1) URL 검증 (Slack 앱 최초 설정 시)
  if (body.type === 'url_verification') {
    return NextResponse.json({ challenge: body.challenge });
  }

  // 2) 서명 검증 (환경변수 없으면 스킵 — 개발 편의)
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (signingSecret) {
    const timestamp = req.headers.get('x-slack-request-timestamp') ?? '';
    const signature = req.headers.get('x-slack-signature') ?? '';

    if (!timestamp || !signature) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 401 });
    }

    if (!verifySlackRequest(signingSecret, { timestamp, signature }, rawBody)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  // 3) 이벤트 추출
  const event = body.event as Record<string, string> | undefined;
  if (!event) {
    return NextResponse.json({ ok: true });
  }

  console.log('[slack-event]', event.type, event.text?.slice(0, 50));

  // 봇 자신의 메시지, 재전송 무시
  if (event.bot_id || event.subtype === 'bot_message') {
    return NextResponse.json({ ok: true });
  }

  if (!markProcessed(event.ts ?? event.event_ts)) {
    return NextResponse.json({ ok: true });
  }

  // 4) app_mention 또는 DM만 처리
  const isAppMention = event.type === 'app_mention';
  const isDirectMessage = event.type === 'message' && event.channel_type === 'im';

  if (isAppMention || isDirectMessage) {
    // response 반환 전에 await로 처리 (Vercel serverless에서 비동기 보장)
    await handleAgentMessage(event).catch(async (err) => {
      console.error('[slack-agent] Error:', err);
      try {
        await slack.chat.postMessage({
          channel: event.channel,
          text: `:x: 봇 에러: ${err instanceof Error ? err.message : String(err)}`,
        });
      } catch { /* ignore */ }
    });
  }

  return NextResponse.json({ ok: true });
}

// =============================================================
// 에이전트 메시지 처리
// =============================================================
async function handleAgentMessage(event: Record<string, string>) {
  const rawText = (event.text ?? '').replace(/<@[A-Z0-9]+>/g, '').trim();
  const channel = event.channel;
  const threadTs = event.thread_ts ?? event.ts;

  // "수정해줘" → GitHub Actions auto-fix 트리거
  const fixMatch = rawText.match(/^(수정해줘|fix|자동수정|autofix)\s+(.+)$/i);
  if (fixMatch) {
    const instruction = fixMatch[2];
    try {
      const ghRes = await fetch(
        'https://api.github.com/repos/a01056014453-bit/Grit.on-app/actions/workflows/agent-autofix.yml/dispatches',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GH_PAT}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'main',
            inputs: { instruction },
          }),
        }
      );

      if (ghRes.ok) {
        await slack.chat.postMessage({
          channel,
          thread_ts: threadTs,
          text: `:rocket: 자동 수정 시작!\n지시: _${instruction}_\n\nGitHub Actions에서 실행 중이에요. PR이 생성되면 여기로 알려드릴게요.`,
        });
      } else {
        await slack.chat.postMessage({
          channel,
          thread_ts: threadTs,
          text: `:x: 자동 수정 트리거 실패: ${ghRes.status}`,
        });
      }
    } catch (err) {
      await slack.chat.postMessage({
        channel,
        thread_ts: threadTs,
        text: `:x: 에러: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
    return;
  }

  // "도움" 또는 "help" → 에이전트 목록 안내
  if (/^(도움|help|에이전트|agents?)$/i.test(rawText)) {
    await slack.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text: `*셈프레 에이전트 팀* :musical_note:\n\n사용법: \`@봇이름 @에이전트 질문\` 또는 \`@봇이름 [에이전트] 질문\`\n지정 안 하면 오케스트레이터가 답합니다.\n\n${getAgentListText()}`,
    });
    return;
  }

  // 에이전트 파싱
  const { agentId, cleanMessage } = parseAgentFromMessage(rawText);
  const agent = AGENTS[agentId];

  if (!cleanMessage) {
    await slack.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text: `${agent.emoji} *${agent.name}* 에이전트입니다. 무엇을 도와드릴까요?`,
    });
    return;
  }

  // 타이핑 인디케이터 (reactions)
  try {
    await slack.reactions.add({ channel, timestamp: event.ts, name: 'hourglass_flowing_sand' });
  } catch {
    // 이미 리액션이 있거나 권한 없으면 무시
  }

  try {
    const botUserId = await getBotUserId();

    // 스레드 히스토리 수집 (대화 맥락 유지)
    const history = event.thread_ts
      ? await getThreadMessages(slack, channel, event.thread_ts, event.ts, botUserId)
      : [];

    // Claude API 호출
    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: 'user', content: cleanMessage },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: buildSystemPrompt(agentId),
      messages,
    });

    const reply =
      response.content[0].type === 'text'
        ? response.content[0].text
        : '응답을 생성할 수 없습니다.';

    // 에이전트 라벨 + 응답
    const formattedReply = `${agent.emoji} *${agent.name}*\n\n${reply}`;

    await slack.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text: formattedReply,
    });
  } catch (error) {
    console.error(`[slack-agent:${agentId}]`, error);

    await slack.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text: `:warning: 오류가 발생했습니다. 잠시 후 다시 시도해주세요.\n\`\`\`${error instanceof Error ? error.message : 'Unknown error'}\`\`\``,
    });
  } finally {
    // 타이핑 인디케이터 제거
    try {
      await slack.reactions.remove({ channel, timestamp: event.ts, name: 'hourglass_flowing_sand' });
    } catch {
      // 무시
    }
  }
}
