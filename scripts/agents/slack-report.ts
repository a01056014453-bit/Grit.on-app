import { WebClient } from '@slack/web-api';
import type { AgentResult, SlackBlock } from './types.js';

const SEVERITY_EMOJI = {
  info: ':white_check_mark:',
  warning: ':warning:',
  critical: ':rotating_light:',
} as const;

// Bot API로 보내면 스레드에서 대화 가능
const SLACK_CHANNEL = process.env.SLACK_AGENT_CHANNEL ?? '새-채널';

function buildBlocks(title: string, results: readonly AgentResult[]): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: title, emoji: true },
    },
    { type: 'divider' },
  ];

  for (const r of results) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${SEVERITY_EMOJI[r.severity]} *${r.agentId}*\n${r.summary}`,
      },
    });

    if (r.details) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: r.details.slice(0, 2900) },
      });
    }
  }

  return blocks;
}

export async function sendSlackReport(
  title: string,
  content: string | readonly AgentResult[]
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[slack] SLACK_WEBHOOK_URL not set, skipping report');
    return;
  }

  // Bot Token이 있으면 Bot API 사용 (스레드 대화 가능)
  const botToken = process.env.SLACK_BOT_TOKEN;
  if (botToken) {
    try {
      const slack = new WebClient(botToken);
      const text = typeof content === 'string'
        ? `*${title}*\n\n${content}`
        : `*${title}*\n\n${content.map((r) => `${SEVERITY_EMOJI[r.severity]} *${r.agentId}*\n${r.summary}\n${r.details?.slice(0, 2900) ?? ''}`).join('\n\n')}`;

      await slack.chat.postMessage({ channel: SLACK_CHANNEL, text });
      return;
    } catch (err) {
      console.error('[slack] Bot API failed, falling back to webhook:', err);
    }
  }

  // Webhook fallback
  const text = typeof content === 'string'
    ? `*${title}*\n\n${content}`
    : `*${title}*`;

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    console.error('[slack] Failed to send:', res.status, await res.text());
  }
}

export async function sendSlackText(text: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}
