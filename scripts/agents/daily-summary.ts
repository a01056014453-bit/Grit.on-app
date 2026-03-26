import { query } from '@anthropic-ai/claude-agent-sdk';
import { buildDailySummaryPrompt } from './prompts.js';
import { sendSlackReport } from './slack-report.js';
import { BUDGET, MAX_TURNS, MODEL } from './types.js';
import type { AgentResult } from './types.js';
import { execSync } from 'child_process';

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
  let resultText = '';

  for await (const message of query({
    prompt: buildDailySummaryPrompt(repoInfo),
    options: {
      cwd: process.cwd(),
      allowedTools: ['Read', 'Glob', 'Grep'],
      model: MODEL,
      maxTurns: MAX_TURNS['daily-summary'],
      maxBudgetUsd: BUDGET['daily-summary'],
    },
  })) {
    if ('result' in message) {
      resultText = message.result;
    }
  }

  if (!resultText) {
    console.log('[daily-summary] No result from agent');
    return;
  }

  const result: AgentResult = {
    agentId: 'orchestrator',
    summary: `${new Date().toLocaleDateString('ko-KR')} 일일 보고`,
    details: resultText,
    severity: 'info',
  };

  await sendSlackReport('📊 셈프레 일일 보고', [result]);
  console.log('[daily-summary] Done');
}
