import { query } from '@anthropic-ai/claude-agent-sdk';
import { buildReviewPrompt } from './prompts.js';
import { sendSlackReport } from './slack-report.js';
import { BUDGET, MAX_TURNS, MODEL } from './types.js';
import type { AgentResult } from './types.js';
import { execSync } from 'child_process';

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

  return execSync(`git diff HEAD~1 -- ${files.join(' ')}`, {
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

  let resultText = '';

  for await (const message of query({
    prompt: buildReviewPrompt(diff),
    options: {
      cwd: process.cwd(),
      allowedTools: ['Read', 'Glob', 'Grep'],
      model: MODEL,
      maxTurns: MAX_TURNS['review-push'],
      maxBudgetUsd: BUDGET['review-push'],
    },
  })) {
    if ('result' in message) {
      resultText = message.result;
    }
  }

  if (!resultText) {
    console.log('[review-push] No result from agent');
    return;
  }

  // 심각도 파싱
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
  console.log('[review-push] Done, reported to Slack');
}
