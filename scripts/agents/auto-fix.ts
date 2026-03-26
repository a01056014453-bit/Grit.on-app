import { sendSlackText } from './slack-report.js';
import { createCopilotIssue } from './orchestrator.js';
import type { AgentResult } from './types.js';

export async function autoFix(instruction: string): Promise<void> {
  console.log('[auto-fix] Delegating to Copilot via GitHub Issue:', instruction.slice(0, 100));

  const result: AgentResult = {
    agentId: 'auto-fix',
    summary: instruction.slice(0, 100),
    details: `## 수동 수정 요청\n\n${instruction}\n\n---\n셈프레 프로젝트 규칙:\n- TypeScript 엄격 모드\n- Supabase RLS 적용\n- 에러 메시지 한국어\n- DB 쓰기는 lib/db-mutate.ts 경유\n- Tailwind CSS만 사용`,
    severity: 'warning',
  };

  const context = {
    commitSha: 'manual',
    commitMsg: instruction.slice(0, 60),
  };

  const issueUrl = await createCopilotIssue(result, context);

  if (issueUrl) {
    await sendSlackText(
      `:robot_face: *수정 요청 접수*\n지시: _${instruction}_\n\nGitHub Issue가 생성되었습니다:\n${issueUrl}\n\nCopilot이 수정 PR을 만들면 알려드립니다. PR 확인 후 머지해주세요.`
    );
  } else {
    await sendSlackText(
      `:warning: Issue 생성에 실패했습니다. GitHub에서 직접 Issue를 만들어주세요.\n지시: _${instruction}_`
    );
  }
}
