/**
 * error-log.mjs
 * 에러 발생 이력을 로컬 로그 파일에 기록한다.
 * 파일: scripts/dev-debugger/logs/errors-YYYY-MM-DD.jsonl
 */

import { appendFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = join(__dirname, 'logs');

/**
 * 에러를 JSONL 파일에 기록한다.
 * @param {Object} entry
 * @param {import('./error-classifier.mjs').ClassifiedError} entry.error
 * @param {boolean} entry.isKnown
 * @param {boolean} entry.slackSent
 * @param {string} [entry.resolution]
 */
export async function appendErrorLog(entry) {
  await mkdir(LOGS_DIR, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const filePath = join(LOGS_DIR, `errors-${date}.jsonl`);

  const record = {
    ...entry,
    loggedAt: new Date().toISOString(),
  };

  await appendFile(filePath, JSON.stringify(record) + '\n', 'utf-8');
}
