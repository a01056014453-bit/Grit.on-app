/**
 * known-issues-store.mjs
 * known-issues.json을 읽고 쓰는 저장소.
 * 파일 I/O는 이 모듈에만 집중한다.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'known-issues.json');

/**
 * DB를 읽어서 반환한다.
 * @returns {Promise<{version: number, issues: Array}>}
 */
export async function loadDB() {
  try {
    const raw = await readFile(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { version: 1, description: '', issues: [] };
  }
}

/**
 * DB를 디스크에 저장한다 (새 객체를 반환).
 * @param {Object} db
 * @returns {Promise<Object>}
 */
export async function saveDB(db) {
  const serialized = JSON.stringify(db, null, 2) + '\n';
  await writeFile(DB_PATH, serialized, 'utf-8');
  return db;
}

/**
 * fingerprint로 기존 이슈를 검색한다.
 * @param {string} fp
 * @returns {Promise<Object | null>}
 */
export async function findByFingerprint(fp) {
  const db = await loadDB();
  return db.issues.find((issue) => issue.fingerprint === fp) ?? null;
}

/**
 * 새 이슈를 추가하거나, 기존 이슈의 occurrences를 증가시킨다.
 * 불변 패턴: 기존 배열을 변경하지 않고 새 배열을 생성한다.
 * @param {Object} params
 * @param {string} params.fingerprint
 * @param {string} params.category
 * @param {string} params.title
 * @param {string} [params.solution]
 * @returns {Promise<{isNew: boolean, issue: Object}>}
 */
export async function upsertIssue({ fingerprint: fp, category, title, solution }) {
  const db = await loadDB();
  const existing = db.issues.find((issue) => issue.fingerprint === fp);

  if (existing) {
    const updatedIssue = {
      ...existing,
      occurrences: existing.occurrences + 1,
      lastSeen: new Date().toISOString(),
    };
    const updatedIssues = db.issues.map((issue) =>
      issue.fingerprint === fp ? updatedIssue : issue
    );
    await saveDB({ ...db, issues: updatedIssues });
    return { isNew: false, issue: updatedIssue };
  }

  const newIssue = {
    fingerprint: fp,
    category,
    title,
    solution: solution ?? '',
    occurrences: 1,
    lastSeen: new Date().toISOString(),
    resolved: false,
  };
  await saveDB({ ...db, issues: [...db.issues, newIssue] });
  return { isNew: true, issue: newIssue };
}

/**
 * 이슈에 해결법을 기록한다.
 * @param {string} fp
 * @param {string} solution
 * @returns {Promise<Object | null>}
 */
export async function markResolved(fp, solution) {
  const db = await loadDB();
  const target = db.issues.find((issue) => issue.fingerprint === fp);
  if (!target) return null;

  const updatedIssue = { ...target, solution, resolved: true };
  const updatedIssues = db.issues.map((issue) =>
    issue.fingerprint === fp ? updatedIssue : issue
  );
  await saveDB({ ...db, issues: updatedIssues });
  return updatedIssue;
}
