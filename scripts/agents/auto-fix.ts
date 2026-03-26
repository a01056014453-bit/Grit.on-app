import Anthropic from '@anthropic-ai/sdk';
import { sendSlackText } from './slack-report.js';
import { MODEL } from './types.js';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface FixInstruction {
  readonly file: string;
  readonly description: string;
  readonly search: string;
  readonly replace: string;
}

export async function autoFix(instruction: string): Promise<void> {
  console.log('[auto-fix] Analyzing:', instruction.slice(0, 100));

  // 1. AI에게 수정 계획 요청
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `셈프레(Sempre) 프로젝트에서 다음 개선을 수행하세요.

프로젝트: Next.js 15 + TypeScript + Supabase + Tailwind CSS
규칙:
- DB 쓰기는 lib/db-mutate.ts 경유
- 타입은 src/types/database.ts 기준
- Tailwind CSS만, 인라인 스타일 금지
- 에러 메시지 한국어

요청: ${instruction}

JSON 배열로 수정 지시를 출력하세요. 각 항목:
- file: 수정할 파일 경로 (src/... 부터)
- description: 뭘 바꾸는지 한 줄 설명
- search: 기존 코드 (정확히 일치해야 함)
- replace: 새 코드

예시:
[{"file":"src/lib/example.ts","description":"에러 메시지 한국어로","search":"throw new Error('Failed')","replace":"throw new Error('처리에 실패했습니다.')"}]

JSON 배열만 출력하세요. 다른 텍스트 없이.`,
    }],
  });

  const resultText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // 2. JSON 파싱
  let fixes: FixInstruction[];
  try {
    const jsonMatch = resultText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('JSON not found');
    fixes = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[auto-fix] Failed to parse AI response:', resultText.slice(0, 500));
    await sendSlackText(`:x: 자동 수정 실패 — AI 응답 파싱 에러`);
    return;
  }

  if (fixes.length === 0) {
    await sendSlackText(`:white_check_mark: 수정할 항목이 없습니다.`);
    return;
  }

  // 3. 파일 수정 적용
  let appliedCount = 0;
  const changes: string[] = [];

  for (const fix of fixes) {
    try {
      const filePath = fix.file.startsWith('/') ? fix.file : `${process.cwd()}/${fix.file}`;
      const content = readFileSync(filePath, 'utf-8');

      if (!content.includes(fix.search)) {
        console.warn(`[auto-fix] Search string not found in ${fix.file}, skipping`);
        changes.push(`:warning: ${fix.file} — 검색 문자열 없음, 스킵`);
        continue;
      }

      const updated = content.replace(fix.search, fix.replace);
      writeFileSync(filePath, updated, 'utf-8');
      appliedCount++;
      changes.push(`:white_check_mark: ${fix.file} — ${fix.description}`);
    } catch (err) {
      changes.push(`:x: ${fix.file} — 수정 실패`);
    }
  }

  if (appliedCount === 0) {
    await sendSlackText(`:warning: 수정을 적용하지 못했습니다.\n${changes.join('\n')}`);
    return;
  }

  // 4. 브랜치 생성 + 커밋 + PR
  const branchName = `auto-fix/${Date.now()}`;
  const prTitle = `fix: ${instruction.slice(0, 60)}`;

  try {
    execSync(`git checkout -b ${branchName}`, { encoding: 'utf-8' });
    execSync('git add -A', { encoding: 'utf-8' });
    execSync(`git commit -m "${prTitle}"`, { encoding: 'utf-8' });
    execSync(`git push -u origin ${branchName}`, { encoding: 'utf-8' });

    const prUrl = execSync(
      `gh pr create --title "${prTitle}" --body "자동 생성된 PR입니다.\n\n수정 내용:\n${changes.join('\n')}\n\n:robot_face: 셈프레 에이전트가 자동 생성" --base main`,
      { encoding: 'utf-8' }
    ).trim();

    await sendSlackText(
      `:rocket: *자동 수정 PR 생성*\n${prUrl}\n\n수정 ${appliedCount}건:\n${changes.join('\n')}`
    );

    console.log(`[auto-fix] PR created: ${prUrl}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[auto-fix] Git/PR error:', msg);
    await sendSlackText(`:x: PR 생성 실패: ${msg.slice(0, 200)}`);
  }
}
