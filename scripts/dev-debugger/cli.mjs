#!/usr/bin/env node

/**
 * cli.mjs
 * known-issues DB를 관리하는 CLI 도구.
 *
 * 사용법:
 *   node scripts/dev-debugger/cli.mjs list              # 모든 이슈 목록
 *   node scripts/dev-debugger/cli.mjs unresolved        # 미해결 이슈만
 *   node scripts/dev-debugger/cli.mjs resolve <idx> "해결법"  # 이슈 해결 처리
 *   node scripts/dev-debugger/cli.mjs stats             # 통계
 *   node scripts/dev-debugger/cli.mjs clear-resolved    # 해결된 이슈 정리
 */

import { loadDB, saveDB, markResolved } from './known-issues-store.mjs';

const [, , command, ...args] = process.argv;

async function run() {
  switch (command) {
    case 'list': {
      const db = await loadDB();
      if (db.issues.length === 0) {
        console.log('등록된 이슈가 없습니다.');
        return;
      }
      db.issues.forEach((issue, i) => {
        const status = issue.resolved ? '✅' : '❌';
        console.log(`[${i}] ${status} [${issue.category}] ${issue.title}`);
        console.log(`    발생횟수: ${issue.occurrences} | 마지막: ${issue.lastSeen ?? '-'}`);
        if (issue.solution) {
          console.log(`    해결법: ${issue.solution}`);
        }
        console.log('');
      });
      break;
    }

    case 'unresolved': {
      const db = await loadDB();
      const unresolved = db.issues.filter((issue) => !issue.resolved);
      if (unresolved.length === 0) {
        console.log('미해결 이슈가 없습니다.');
        return;
      }
      unresolved.forEach((issue) => {
        console.log(`❌ [${issue.category}] ${issue.title}`);
        console.log(`   발생횟수: ${issue.occurrences}`);
        console.log('');
      });
      break;
    }

    case 'resolve': {
      const idx = parseInt(args[0], 10);
      const solution = args[1];
      if (isNaN(idx) || !solution) {
        console.error('사용법: resolve <인덱스> "해결법"');
        process.exit(1);
      }
      const db = await loadDB();
      const issue = db.issues[idx];
      if (!issue) {
        console.error(`인덱스 ${idx}에 해당하는 이슈가 없습니다.`);
        process.exit(1);
      }
      await markResolved(issue.fingerprint, solution);
      console.log(`✅ 해결 완료: ${issue.title}`);
      break;
    }

    case 'stats': {
      const db = await loadDB();
      const total = db.issues.length;
      const resolved = db.issues.filter((i) => i.resolved).length;
      const byCategory = {};
      for (const issue of db.issues) {
        byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1;
      }
      console.log(`총 이슈: ${total} (해결: ${resolved}, 미해결: ${total - resolved})`);
      console.log('카테고리별:');
      for (const [cat, count] of Object.entries(byCategory)) {
        console.log(`  ${cat}: ${count}`);
      }
      break;
    }

    case 'clear-resolved': {
      const db = await loadDB();
      const remaining = db.issues.filter((i) => !i.resolved);
      const removed = db.issues.length - remaining.length;
      await saveDB({ ...db, issues: remaining });
      console.log(`${removed}개 해결된 이슈 정리 완료.`);
      break;
    }

    default:
      console.log(`SEMPRE Dev Debugger CLI

사용법:
  list              모든 이슈 목록
  unresolved        미해결 이슈만
  resolve <idx> "해결법"  이슈 해결 처리
  stats             통계
  clear-resolved    해결된 이슈 정리`);
  }
}

run().catch((err) => {
  console.error('CLI 에러:', err.message);
  process.exit(1);
});
