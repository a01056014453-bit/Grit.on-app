import { query } from '@anthropic-ai/claude-agent-sdk';
import { buildPrReviewPrompt } from './prompts.js';
import { sendSlackReport } from './slack-report.js';
import { BUDGET, MAX_TURNS, MODEL } from './types.js';
import type { AgentResult } from './types.js';
import { execSync } from 'child_process';

export async function reviewPr(prNumber: number): Promise<void> {
  // PR 정보 가져오기
  const prJson = execSync(
    `gh pr view ${prNumber} --json title,body,baseRefName,headRefName`,
    { encoding: 'utf-8' }
  );
  const pr = JSON.parse(prJson);

  // PR diff
  const diff = execSync(`gh pr diff ${prNumber}`, {
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024,
  });

  if (!diff || diff.length < 20) {
    console.log('[review-pr] No significant diff');
    return;
  }

  console.log(`[review-pr] Reviewing PR #${prNumber}: ${pr.title}`);

  let resultText = '';

  for await (const message of query({
    prompt: buildPrReviewPrompt(pr.body ?? '', diff),
    options: {
      cwd: process.cwd(),
      allowedTools: ['Read', 'Glob', 'Grep'],
      model: MODEL,
      maxTurns: MAX_TURNS['review-pr'],
      maxBudgetUsd: BUDGET['review-pr'],
    },
  })) {
    if ('result' in message) {
      resultText = message.result;
    }
  }

  if (!resultText) return;

  // PR에 코멘트 작성
  execSync(`gh pr comment ${prNumber} --body "${resultText.replace(/"/g, '\\"').slice(0, 60000)}"`, {
    encoding: 'utf-8',
  });

  const severity = resultText.includes('critical')
    ? 'critical'
    : resultText.includes('warning')
      ? 'warning'
      : 'info';

  const result: AgentResult = {
    agentId: 'orchestrator',
    summary: `PR #${prNumber}: ${pr.title}`,
    details: resultText,
    severity,
  };

  await sendSlackReport(`📋 PR 리뷰 — #${prNumber} ${pr.title}`, [result]);
  console.log(`[review-pr] Done, commented on PR #${prNumber}`);
}
