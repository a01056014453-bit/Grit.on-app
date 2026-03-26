import { query } from '@anthropic-ai/claude-agent-sdk';
import { buildIssueClassifyPrompt } from './prompts.js';
import { sendSlackText } from './slack-report.js';
import { BUDGET, MAX_TURNS, MODEL } from './types.js';
import { execSync } from 'child_process';

export async function classifyIssue(issueNumber: number): Promise<void> {
  const issueJson = execSync(
    `gh issue view ${issueNumber} --json title,body,labels`,
    { encoding: 'utf-8' }
  );
  const issue = JSON.parse(issueJson);

  console.log(`[classify-issue] Classifying issue #${issueNumber}: ${issue.title}`);

  let resultText = '';

  for await (const message of query({
    prompt: buildIssueClassifyPrompt(issue.title, issue.body ?? ''),
    options: {
      model: MODEL,
      maxTurns: MAX_TURNS['classify-issue'],
      maxBudgetUsd: BUDGET['classify-issue'],
    },
  })) {
    if ('result' in message) {
      resultText = message.result;
    }
  }

  if (!resultText) return;

  // JSON 파싱 시도
  try {
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const classification = JSON.parse(jsonMatch[0]);

      // 라벨 추가
      const labels = [classification.area, classification.type, classification.priority]
        .filter(Boolean);

      if (labels.length > 0) {
        execSync(
          `gh issue edit ${issueNumber} --add-label "${labels.join(',')}"`,
          { encoding: 'utf-8' }
        );
      }

      const emoji = classification.priority === 'critical' ? '🚨'
        : classification.priority === 'high' ? '🔴'
          : classification.priority === 'medium' ? '🟡' : '🟢';

      await sendSlackText(
        `${emoji} *새 이슈 #${issueNumber}*: ${issue.title}\n` +
        `담당: \`${classification.area}\` | 유형: \`${classification.type}\` | 우선순위: \`${classification.priority}\`\n` +
        `> ${classification.summary}`
      );
    }
  } catch {
    await sendSlackText(`📌 새 이슈 #${issueNumber}: ${issue.title}\n${resultText.slice(0, 500)}`);
  }

  console.log(`[classify-issue] Done, issue #${issueNumber} classified`);
}
