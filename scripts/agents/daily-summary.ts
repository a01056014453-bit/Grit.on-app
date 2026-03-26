import Anthropic from '@anthropic-ai/sdk';
import { buildDailySummaryPrompt } from './prompts.js';
import { sendSlackReport } from './slack-report.js';
import { MODEL } from './types.js';
import { execSync } from 'child_process';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function gatherRepoInfo(): string {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const commits = execSync(
    `git log --since="${since}" --oneline --no-merges 2>/dev/null || echo "커밋 없음"`,
    { encoding: 'utf-8' }
  );

  let openPrs = '없음';
  let openIssues = '없음';

  try {
    openPrs = execSync('gh pr list --state open --json number,title --limit 10', { encoding: 'utf-8' });
    openIssues = execSync('gh issue list --state open --json number,title,labels --limit 10', { encoding: 'utf-8' });
  } catch {
    // gh CLI 없거나 인증 안 되면 스킵
  }

  return `
## 지난 24시간 커밋
${commits}

## 열린 PR
${openPrs}

## 열린 이슈
${openIssues}
`.trim();
}

export async function dailySummary(): Promise<void> {
  console.log('[daily-summary] Gathering repo info...');

  const repoInfo = gatherRepoInfo();

  const response = await anthropic.messages.create({
    model: MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildDailySummaryPrompt(repoInfo) }],
  });

  const resultText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  if (!resultText) {
    console.warn('[daily-summary] 빈 결과');
    return;
  }

  await sendSlackReport('daily-summary', resultText);
  console.log('[daily-summary] Done.');
}
