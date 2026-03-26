/**
 * Agent Runner — CLI 진입점
 *
 * Usage:
 *   npx tsx scripts/agents/runner.ts review-push
 *   npx tsx scripts/agents/runner.ts review-pr --pr=123
 *   npx tsx scripts/agents/runner.ts classify-issue --issue=456
 *   npx tsx scripts/agents/runner.ts daily-summary
 *   npx tsx scripts/agents/runner.ts auto-fix --instruction="개선 내용"
 */

import { sendSlackText } from './slack-report.js';

const [command, ...args] = process.argv.slice(2);

function getFlag(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=')[1];
}

async function main() {
  console.log(`[runner] Command: ${command}`);

  try {
    switch (command) {
      case 'review-push': {
        const { reviewPush } = await import('./review-push.js');
        await reviewPush();
        break;
      }
      case 'review-pr': {
        const prNumber = Number(getFlag('pr'));
        if (!prNumber) throw new Error('--pr=NUMBER required');
        const { reviewPr } = await import('./review-pr.js');
        await reviewPr(prNumber);
        break;
      }
      case 'classify-issue': {
        const issueNumber = Number(getFlag('issue'));
        if (!issueNumber) throw new Error('--issue=NUMBER required');
        const { classifyIssue } = await import('./classify-issue.js');
        await classifyIssue(issueNumber);
        break;
      }
      case 'daily-summary': {
        const { dailySummary } = await import('./daily-summary.js');
        await dailySummary();
        break;
      }
      case 'auto-fix': {
        const instruction = getFlag('instruction');
        if (!instruction) throw new Error('--instruction="내용" required');
        const { autoFix } = await import('./auto-fix.js');
        await autoFix(instruction);
        break;
      }
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Available: review-push, review-pr, classify-issue, daily-summary');
        process.exit(1);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[runner] Error:`, msg);
    await sendSlackText(`:x: 에이전트 에러 (${command}): ${msg}`);
    process.exit(1);
  }
}

main();
