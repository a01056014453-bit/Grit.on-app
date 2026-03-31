/**
 * V3 DB 마이그레이션 실행 스크립트
 *
 * 사용법:
 *   SUPABASE_DB_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" node scripts/run-v3-migration.mjs
 *
 * 또는 Supabase 대시보드 SQL Editor에서 supabase/migrations/20260331_v3_schema_columns.sql 직접 실행
 */

import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("❌ SUPABASE_DB_URL 환경변수가 필요합니다.");
  console.error("예: SUPABASE_DB_URL=\"postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres\" node scripts/run-v3-migration.mjs");
  process.exit(1);
}

const sql = readFileSync(
  resolve(__dirname, "../supabase/migrations/20260331_v3_schema_columns.sql"),
  "utf-8"
);

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("✅ DB 연결 성공");

  // 세미콜론으로 분리하여 개별 실행
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let success = 0;
  let skipped = 0;

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      success++;
      // 컬럼/인덱스 이름 추출해서 로그
      const match = stmt.match(/(?:ADD COLUMN|CREATE INDEX).*?(?:IF NOT EXISTS\s+)?(\w+)/i);
      const name = match?.[1] ?? stmt.slice(0, 60);
      console.log(`  ✅ ${name}`);
    } catch (err) {
      if (err.message?.includes("already exists")) {
        skipped++;
        console.log(`  ⏭️  이미 존재: ${stmt.slice(0, 60)}...`);
      } else {
        console.error(`  ❌ 실패: ${stmt.slice(0, 60)}...`);
        console.error(`     ${err.message}`);
      }
    }
  }

  console.log(`\n완료: ${success} 성공, ${skipped} 스킵`);

  // 결과 확인
  const { rows: saCols } = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'song_analyses' ORDER BY ordinal_position"
  );
  console.log(`\nsong_analyses 컬럼 (${saCols.length}개):`);
  console.log(saCols.map((r) => r.column_name).join(", "));

  const { rows: ajCols } = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'analysis_jobs' ORDER BY ordinal_position"
  );
  console.log(`\nanalysis_jobs 컬럼 (${ajCols.length}개):`);
  console.log(ajCols.map((r) => r.column_name).join(", "));

} catch (err) {
  console.error("❌ 오류:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
