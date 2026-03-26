import Anthropic from '@anthropic-ai/sdk';
import { buildReviewPrompt } from './prompts.js';
import { sendSlackReport } from './slack-report.js';
import { orchestrate } from './orchestrator.js';
import { MODEL } from './types.js';
import type { AgentResult } from './types.js';
import { execSync } from 'child_process';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SKIP_PATTERNS = [
  /^package-lock\.json$/,
  /\.md$/,
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
  /^\.github\//,
  /^docs\//,
];

function getDiff(): string {
  const files = execSync('git diff HEAD~1 --name-only', { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean)
    .filter((f) => !SKIP_PATTERNS.some((p) => p.test(f)));

  if (files.length === 0) return '';

  const quotedFiles = files.map((f) => `'${f}'`).join(' ');
  return execSync(`git diff HEAD~1 -- ${quotedFiles}`, {
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024,
  });
}

export async function reviewPush(): Promise<void> {
  const diff = getDiff();

  if (!diff || diff.length < 20) {
    console.log('[review-push] No significant changes, skipping');
    return;
  }

  console.log(`[review-push] Reviewing ${diff.split('\n').length} lines of diff`);

  const response = await anthropic.messages.create({
    model: MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildReviewPrompt(diff) }],
  });

  const resultText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  if (!resultText) {
    console.log('[review-push] No result from agent');
    return;
  }

  const severity = resultText.includes('critical')
    ? 'critical'
    : resultText.includes('warning')
      ? 'warning'
      : 'info';

  const commitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  const commitMsg = execSync('git log -1 --pretty=%s', { encoding: 'utf-8' }).trim();

  const result: AgentResult = {
    agentId: 'auditor',
    summary: `\`${commitSha}\` ${commitMsg}`,
    details: resultText,
    severity,
  };

  await sendSlackReport(`🔍 코드 리뷰 — ${commitMsg}`, [result]);

  if (severity === 'critical' || severity === 'warning') {
    await orchestrate([result], { commitSha, commitMsg });
  }

  console.log('[review-push] Done, reported to Slack');
}
