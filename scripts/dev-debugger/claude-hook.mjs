#!/usr/bin/env node

/**
 * claude-hook.mjs
 * Claude Code의 PostToolUse hook으로 실행된다.
 * Bash 명령 실행 후 에러가 감지되면, 분류 + known-issues 조회 결과를
 * Claude Code에게 컨텍스트로 전달한다.
 *
 * .claude/settings.local.json의 hooks 설정에 등록하여 사용.
 *
 * stdin으로 hook payload (JSON)를 받고,
 * stdout으로 응답 (JSON)을 반환한다.
 */

import { classifyError, fingerprint } from './error-classifier.mjs';
import { findByFingerprint, upsertIssue } from './known-issues-store.mjs';
import { appendErrorLog } from './error-log.mjs';

async function main() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    // hook payload가 아니면 무시
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  // Bash 도구 실행 결과만 처리
  const toolName = payload?.tool_name ?? '';
  const output = payload?.tool_output ?? '';

  if (toolName !== 'Bash' || !output) {
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  // exit code가 0이 아닌 경우 또는 에러 패턴이 있는 경우
  const hasError =
    payload?.tool_exit_code !== 0 ||
    /error|Error:|TypeError|SyntaxError|Module not found|Failed/i.test(output);

  if (!hasError) {
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  // 에러 분류
  const classified = classifyError(output);
  const fp = fingerprint(classified);

  // known-issues 조회
  const knownIssue = await findByFingerprint(fp);
  const isKnown = knownIssue !== null;

  // DB에 기록
  await upsertIssue({
    fingerprint: fp,
    category: classified.category,
    title: classified.title,
  });

  // 로그 기록
  await appendErrorLog({ error: classified, isKnown, slackSent: false });

  // Claude Code에게 전달할 컨텍스트
  const context = [];
  context.push(`[Auto-Debug] 에러 감지됨: ${classified.category} (${classified.severity})`);
  context.push(`제목: ${classified.title}`);

  if (classified.file) {
    context.push(`파일: ${classified.file}${classified.line ? `:${classified.line}` : ''}`);
  }

  if (isKnown && knownIssue.solution) {
    context.push(`\n이전에 동일한 에러가 발생했습니다 (${knownIssue.occurrences}회).`);
    context.push(`이전 해결법: ${knownIssue.solution}`);
  }

  // hook 응답: continue=true + 추가 메시지
  const response = {
    continue: true,
    message: context.join('\n'),
  };

  process.stdout.write(JSON.stringify(response));
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ continue: true }));
});
