/**
 * Slack 스레드 대화 히스토리 관리
 * Slack API로 스레드 메시지를 가져와서 Claude 메시지 배열로 변환
 */

import type { WebClient } from '@slack/web-api';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

const BOT_MENTION_PATTERN = /<@[A-Z0-9]+>/g;

function cleanSlackText(text: string): string {
  return text.replace(BOT_MENTION_PATTERN, '').trim();
}

/**
 * 스레드 히스토리를 Claude 메시지 배열로 변환
 * @param slack - Slack WebClient
 * @param channel - 채널 ID
 * @param threadTs - 스레드 timestamp
 * @param currentTs - 현재 메시지 ts (제외용)
 * @param botUserId - 봇 유저 ID (assistant 역할 구분)
 * @param limit - 최대 메시지 수
 */
export async function getThreadMessages(
  slack: WebClient,
  channel: string,
  threadTs: string,
  currentTs: string,
  botUserId: string,
  limit = 20
): Promise<ClaudeMessage[]> {
  const result = await slack.conversations.replies({
    channel,
    ts: threadTs,
    limit,
  });

  const messages: ClaudeMessage[] = [];

  for (const msg of result.messages ?? []) {
    if (msg.ts === currentTs) continue;

    const cleaned = cleanSlackText(msg.text ?? '');
    if (!cleaned) continue;

    messages.push({
      role: msg.user === botUserId ? 'assistant' : 'user',
      content: cleaned,
    });
  }

  return messages;
}
