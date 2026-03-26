import { readFileSync } from 'fs';
import { join } from 'path';

const AGENTS_DIR = join(process.cwd(), '.claude', 'agents');

function loadAgentMd(filename: string): string {
  try {
    return readFileSync(join(AGENTS_DIR, filename), 'utf-8');
  } catch {
    return '';
  }
}

const SEMPRE_CONTEXT = `
셈프레(Sempre) — 클래식 음악 전공생을 위한 AI 순연습시간 측정 & 연습 관리 플랫폼.
기술 스택: Next.js 15 + React 19 + TypeScript 5 + Supabase + Tailwind CSS 4

코드 컨벤션:
- DB 쓰기: lib/db-mutate.ts 경유
- 타입: src/types/database.ts 기준
- 모든 테이블 RLS 필수
- 에러 메시지: 한국어
- Tailwind CSS만, 인라인 스타일 금지
`.trim();

export function buildReviewPrompt(diff: string): string {
  const auditorMd = loadAgentMd('auditor.md');
  return `${SEMPRE_CONTEXT}

---

${auditorMd}

---

## 리뷰 대상 코드 변경사항

\`\`\`diff
${diff.slice(0, 15000)}
\`\`\`

위 변경사항을 감사 기준에 따라 리뷰하세요.

출력 규칙:
- Slack mrkdwn만 사용 (*볼드*, \`코드\`, > 인용)
- ## ### ** --- 같은 마크다운 헤더/구분선 절대 금지
- [x] 체크박스 형식 금지
- 이모지는 Slack 형식 (:white_check_mark:, :x:, :warning:)
- 간결하게

형식:
심각도: info / warning / critical

요약
(한 줄)

통과 항목
:white_check_mark: 항목1
:white_check_mark: 항목2

문제 항목
:x: 항목1 — 설명
:warning: 항목2 — 설명

개선 제안
(있으면)`;
}

export function buildPrReviewPrompt(prBody: string, diff: string): string {
  const orchestratorMd = loadAgentMd('orchestrator.md');
  return `${SEMPRE_CONTEXT}

---

${orchestratorMd}

---

## PR 내용
${prBody}

## 변경사항
\`\`\`diff
${diff.slice(0, 20000)}
\`\`\`

이 PR을 오케스트레이터 관점에서 분석하세요:
1. 어떤 에이전트(프론트엔드/백엔드/AI) 관점의 변경인지
2. 감사 기준에 따른 문제점
3. 전체 요약 + 개선 제안`;
}

export function buildIssueClassifyPrompt(title: string, body: string): string {
  return `${SEMPRE_CONTEXT}

---

## GitHub 이슈 분류

제목: ${title}
내용: ${body.slice(0, 3000)}

다음을 판단하세요:
1. 담당 영역: frontend / backend / ai-ml / classical-music / planner
2. 유형: bug / feature / improvement / question
3. 우선순위: critical / high / medium / low
4. 한 줄 요약

JSON 형식으로 출력:
{"area":"...","type":"...","priority":"...","summary":"..."}`;
}

export function buildDailySummaryPrompt(repoInfo: string): string {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  return `${SEMPRE_CONTEXT}

---

오늘 날짜: ${today}
분석 에이전트: 오케스트레이터

${repoInfo}

위 정보를 바탕으로 Slack 일일 보고를 작성하세요.

절대 금지 (위반 시 출력 거부):
- #, ##, ###, **, ---, ___  사용 금지. 하나라도 포함하면 잘못된 출력.
- [x], [ ] 체크박스 금지
- 마크다운 문법 일체 금지

허용되는 형식:
- *볼드* (별표 1개씩만)
- \`코드\`
- :이모지:
- > 인용
- 줄바꿈

아래 예시를 정확히 따라 작성:

:clipboard: 셈프레 일일 보고 — ${today}
분석: 오케스트레이터 에이전트

:hammer_and_wrench: 어제 주요 변경
• \`커밋해시\` 변경 내용 한 줄
• \`커밋해시\` 변경 내용 한 줄

:arrows_counterclockwise: 열린 PR
• 없음 (또는 PR 목록)

:warning: 미해결 이슈
• 없음 (또는 이슈 목록)

:dart: 오늘 우선순위
• 할 일 1
• 할 일 2

:zap: 주의사항
• 있으면 작성`;
}
