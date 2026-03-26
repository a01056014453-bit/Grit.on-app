import { sendSlackText } from './slack-report.js';
import type { AgentResult } from './types.js';

const GITHUB_REPO = process.env.GITHUB_REPO ?? 'a01056014453-bit/Grit.on-app';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

interface GitHubIssueResponse {
  html_url: string;
  number: number;
}

export async function createCopilotIssue(
  result: AgentResult,
  context: { commitSha: string; commitMsg: string }
): Promise<string | null> {
  if (!GITHUB_TOKEN) {
    console.warn('[orchestrator] GITHUB_TOKEN not set, skipping issue creation');
    return null;
  }

  const issueBody = `## 🔍 감사 에이전트 자동 감지\n\n**커밋**: \`${context.commitSha}\` — ${context.commitMsg}\n**심각도**: ${result.severity === 'critical' ? '🚨 심각' : '⚠️ 경고'}\n\n---\n\n## 문제 내용\n\n${result.details}\n\n---\n\n## 수정 요청\n\n위 문제를 셈프레 프로젝트 규칙에 맞게 수정해주세요:\n- TypeScript 엄격 모드\n- Supabase RLS 적용\n- 에러 메시지 한국어\n- DB 쓰기는 lib/db-mutate.ts 경유\n\n> 🤖 이 이슈는 셈프레 감사 에이전트가 자동 생성했습니다. Draft PR을 만들어주세요.`;

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `[자동감지] ${context.commitMsg.slice(0, 60)}`,
        body: issueBody,
        labels: ['agent-detected', result.severity === 'critical' ? 'critical' : 'warning'],
      }),
    });

    if (!res.ok) {
      console.error('[orchestrator] Issue 생성 실패:', res.status);
      return null;
    }

    const issue = (await res.json()) as GitHubIssueResponse;
    console.log(`[orchestrator] Issue 생성: ${issue.html_url}`);
    return issue.html_url;
  } catch (err) {
    console.error('[orchestrator] Issue 생성 에러:', err);
    return null;
  }
}

export async function orchestrate(
  results: AgentResult[],
  context: { commitSha: string; commitMsg: string }
): Promise<void> {
  const criticals = results.filter((r) => r.severity === 'critical');
  const warnings = results.filter((r) => r.severity === 'warning');

  if (criticals.length === 0 && warnings.length === 0) return;

  const issueUrls: string[] = [];

  for (const result of criticals) {
    const url = await createCopilotIssue(result, context);
    if (url) issueUrls.push(url);
  }

  const lines: string[] = [
    `🤖 *오케스트레이터 보고서*`,
    `커밋: \`${context.commitSha}\` ${context.commitMsg}`,
    '',
  ];

  if (criticals.length > 0) {
    lines.push(`🚨 *심각 ${criticals.length}건 — GitHub Issue 자동 생성됨*`);
    issueUrls.forEach((url) => lines.push(`• ${url}`));
    lines.push('');
    lines.push('_PR 확인 후 머지해주세요._');
  }

  if (warnings.length > 0) {
    lines.push(`⚠️ *경고 ${warnings.length}건 — 수동 검토 권장*`);
    warnings.forEach((w) => lines.push(`• ${w.summary}`));
  }

  await sendSlackText(lines.join('\n'));
}
