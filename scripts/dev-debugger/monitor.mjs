#!/usr/bin/env node

/**
 * monitor.mjs
 * Next.js 개발 서버를 실행하고, stdout/stderr를 실시간 파싱하여
 * 에러를 감지 -> 분류 -> known-issues 조회 -> Slack 알림 -> 로그 기록한다.
 *
 * 사용법:
 *   node scripts/dev-debugger/monitor.mjs
 *   # 또는
 *   npm run dev:debug
 *
 * 환경 변수:
 *   SLACK_WEBHOOK_URL - Slack Incoming Webhook URL (선택)
 *   DEV_PORT          - 개발 서버 포트 (기본 3000)
 *   DEBOUNCE_MS       - 같은 에러 재알림 방지 시간 (기본 30000)
 */

import { spawn } from 'node:child_process';
import { classifyError, fingerprint } from './error-classifier.mjs';
import { findByFingerprint, upsertIssue } from './known-issues-store.mjs';
import { notifySlack } from './slack-notifier.mjs';
import { appendErrorLog } from './error-log.mjs';

const PORT = process.env.DEV_PORT ?? '3000';
const DEBOUNCE_MS = parseInt(process.env.DEBOUNCE_MS ?? '30000', 10);

// 최근 알림 전송 시각 (fingerprint -> timestamp)
const recentAlerts = new Map();

// 에러 메시지 버퍼 (멀티라인 에러를 모으기 위함)
let errorBuffer = '';
let bufferTimeout = null;
const BUFFER_FLUSH_MS = 500;

/**
 * 에러 라인인지 판별한다.
 * @param {string} line
 * @returns {boolean}
 */
function isErrorLine(line) {
  const ERROR_INDICATORS = [
    /error/i,
    /Error:/,
    /ERR[_!]/,
    /Failed/i,
    /TypeError/,
    /ReferenceError/,
    /SyntaxError/,
    /Module not found/i,
    /Cannot find module/i,
    /Unhandled/i,
    /ECONNREFUSED/,
    /ENOENT/,
    /TS\d{4,5}:/,
  ];

  return ERROR_INDICATORS.some((pattern) => pattern.test(line));
}

/**
 * 무시할 노이즈 패턴.
 * @param {string} line
 * @returns {boolean}
 */
function isNoise(line) {
  const NOISE_PATTERNS = [
    /Fast Refresh/i,
    /Compiling/i,
    /compiled.*successfully/i,
    /waiting.*changes/i,
    /^\s*$/,
    /^[▲○●]/,
    /webpack.*compiled/i,
  ];

  return NOISE_PATTERNS.some((pattern) => pattern.test(line));
}

/**
 * 버퍼에 쌓인 에러를 처리한다.
 */
async function flushErrorBuffer() {
  if (!errorBuffer.trim()) return;

  const message = errorBuffer.trim();
  errorBuffer = '';

  await handleError(message);
}

/**
 * 에러를 분류하고 알림/기록한다.
 * @param {string} rawMessage
 */
async function handleError(rawMessage) {
  try {
    // 1) 분류
    const classified = classifyError(rawMessage);
    const fp = fingerprint(classified);

    // 2) 디바운스 체크 (같은 에러 연속 발생 시 무시)
    const lastAlert = recentAlerts.get(fp);
    if (lastAlert && Date.now() - lastAlert < DEBOUNCE_MS) {
      return;
    }
    recentAlerts.set(fp, Date.now());

    // 3) known-issues 조회
    const knownIssue = await findByFingerprint(fp);
    const isKnown = knownIssue !== null;

    // 4) known-issues 업데이트
    await upsertIssue({
      fingerprint: fp,
      category: classified.category,
      title: classified.title,
    });

    // 5) 콘솔 출력
    const prefix = isKnown ? '🔄 [재발]' : '🆕 [신규]';
    console.log('');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`${prefix} ${classified.category.toUpperCase()} | ${classified.severity}`);
    console.log(`  제목: ${classified.title}`);
    if (classified.file) {
      console.log(`  파일: ${classified.file}${classified.line ? `:${classified.line}` : ''}`);
    }
    if (isKnown && knownIssue.solution) {
      console.log(`  💡 이전 해결법: ${knownIssue.solution}`);
    }
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('');

    // 6) Slack 알림
    const slackSent = await notifySlack({
      error: classified,
      isKnown,
      previousSolution: knownIssue?.solution,
    });

    // 7) 로그 파일 기록
    await appendErrorLog({
      error: classified,
      isKnown,
      slackSent,
    });
  } catch (err) {
    console.error('[monitor] 에러 처리 중 예외:', err.message);
  }
}

/**
 * 데이터 라인을 처리한다.
 * @param {string} line
 * @param {'stdout' | 'stderr'} source
 */
function processLine(line, source) {
  // 항상 원래 출력을 그대로 표시
  if (source === 'stdout') {
    process.stdout.write(line + '\n');
  } else {
    process.stderr.write(line + '\n');
  }

  // 노이즈 무시
  if (isNoise(line)) return;

  // 에러 라인 감지
  if (isErrorLine(line)) {
    errorBuffer += line + '\n';

    // 멀티라인 에러를 모으기 위해 타이머 리셋
    if (bufferTimeout) clearTimeout(bufferTimeout);
    bufferTimeout = setTimeout(flushErrorBuffer, BUFFER_FLUSH_MS);
    return;
  }

  // 에러 버퍼에 내용이 있고, 스택 트레이스 등 연속 라인이면 추가
  if (errorBuffer && (line.startsWith('  ') || line.startsWith('\t') || line.startsWith('at '))) {
    errorBuffer += line + '\n';
    if (bufferTimeout) clearTimeout(bufferTimeout);
    bufferTimeout = setTimeout(flushErrorBuffer, BUFFER_FLUSH_MS);
  }
}

/**
 * Next.js 개발 서버를 시작하고 모니터링한다.
 */
function startMonitor() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  SEMPRE Dev Debugger Monitor v1.0        ║');
  console.log('║  에러 감지 + 분류 + 기록 + 알림          ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`  포트: ${PORT}`);
  console.log(`  디바운스: ${DEBOUNCE_MS}ms`);
  console.log(`  Slack: ${process.env.SLACK_WEBHOOK_URL ? '활성' : '비활성'}`);
  console.log('');

  const child = spawn('npx', ['next', 'dev', '-p', PORT], {
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: '1' },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  let stdoutRemainder = '';
  let stderrRemainder = '';

  child.stdout.on('data', (chunk) => {
    const text = stdoutRemainder + chunk.toString();
    const lines = text.split('\n');
    stdoutRemainder = lines.pop() ?? '';
    for (const line of lines) {
      processLine(line, 'stdout');
    }
  });

  child.stderr.on('data', (chunk) => {
    const text = stderrRemainder + chunk.toString();
    const lines = text.split('\n');
    stderrRemainder = lines.pop() ?? '';
    for (const line of lines) {
      processLine(line, 'stderr');
    }
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`\n[monitor] 개발 서버 종료 (exit code: ${code})`);
    }
    process.exit(code ?? 0);
  });

  // graceful shutdown
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      child.kill(signal);
    });
  }
}

startMonitor();
