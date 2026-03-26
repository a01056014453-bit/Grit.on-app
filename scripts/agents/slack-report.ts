import type { AgentResult, SlackBlock } from './types.js';

const SEVERITY_EMOJI = {
  info: ':white_check_mark:',
  warning: ':warning:',
  critical: ':rotating_light:',
} as const;

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
  results: readonly AgentResult[]
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[slack] SLACK_WEBHOOK_URL not set, skipping report');
    return;
  }

  const blocks = buildBlocks(title, results);

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: title,
      blocks,
    }),
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
