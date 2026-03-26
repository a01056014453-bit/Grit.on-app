import Anthropic from '@anthropic-ai/sdk';
import { buildPrReviewPrompt } from './prompts.js';
import { sendSlackReport } from './slack-report.js';
import { MODEL } from './types.js';
import type { AgentResult } from './types.js';
import { execSync } from 'child_process';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function reviewPr(prNumber: number): Promise<void> {
  const prJson = execSync(
    `gh pr view ${prNumber} --json title,body,baseRefName,headRefName`,
    { encoding: 'utf-8' }
  );
  const pr = JSON.parse(prJson);

  const diff = execSync(`gh pr diff ${prNumber}`, {
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024,
  });

  if (!diff || diff.length < 20) {
    console.log('[review-pr] No significant diff');
    return;
  }

  console.log(`[review-pr] Reviewing PR #${prNumber}: ${pr.title}`);

  const response = await anthropic.messages.create({
    model: MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildPrReviewPrompt(pr.body ?? '', diff) }],
  });

  const resultText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  if (!resultText) return;

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
    action: 'review-pr',
    severity,
    summary: `PR #${prNumber} 리뷰 완료`,
    details: resultText.slice(0, 500),
  };

  await sendSlackReport('review-pr', JSON.stringify(result, null, 2));
}
