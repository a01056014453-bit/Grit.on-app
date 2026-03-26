import Anthropic from '@anthropic-ai/sdk';
import { buildIssueClassifyPrompt } from './prompts.js';
import { sendSlackText } from './slack-report.js';
import { MODEL } from './types.js';
import { execSync } from 'child_process';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function classifyIssue(issueNumber: number): Promise<void> {
  const issueJson = execSync(
    `gh issue view ${issueNumber} --json title,body,labels`,
    { encoding: 'utf-8' }
  );
  const issue = JSON.parse(issueJson);

  console.log(`[classify-issue] Classifying issue #${issueNumber}: ${issue.title}`);

  const response = await anthropic.messages.create({
    model: MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildIssueClassifyPrompt(issue.title, issue.body ?? '') }],
  });

  const resultText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  if (!resultText) return;

  try {
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const classification = JSON.parse(jsonMatch[0]);

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
