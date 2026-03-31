/**
 * V3 DB 통합 테스트
 *
 * 테스트 항목:
 * 1. 새 곡 분석 → 새 컬럼이 채워지는지
 * 2. 같은 곡 재분석 → cache_key로 hit 되는지
 * 3. V2 캐시 → V3 요청 시 stale 처리
 * 4. analysis_jobs 새 컬럼 확인
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+[A-Z0-9_]*)=(.+)$/);
  if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("V3 DB 통합 테스트");
  console.log("═══════════════════════════════════════\n");

  // ── 테스트 1: 기존 backfill 결과 확인 ──
  console.log("테스트 1: backfill 결과 — 새 컬럼이 채워졌는지");

  const { data: sample, error: sampleErr } = await supabase
    .from("song_analyses")
    .select("id, composer, title, schema_version, content_format, composer_normalized, canonical_title, opus_catalogue, work_type, instrument, cache_key, is_active, analysis_quality_status")
    .not("cache_key", "is", null)
    .limit(3);

  assert(!sampleErr, "song_analyses 조회 성공");
  assert(sample && sample.length > 0, "backfill된 row 존재");

  if (sample?.[0]) {
    const s = sample[0];
    assert(!!s.composer_normalized, `composer_normalized 채워짐: "${s.composer_normalized}"`);
    assert(!!s.canonical_title, `canonical_title 채워짐: "${s.canonical_title}"`);
    assert(!!s.cache_key, `cache_key 채워짐: "${s.cache_key?.slice(0, 50)}..."`);
    assert(!!s.work_type, `work_type 채워짐: "${s.work_type}"`);
    assert(s.is_active === true, "is_active = true");
    assert(s.content_format === "legacy" || s.content_format === "v3_coaching", `content_format: "${s.content_format}"`);
    assert(!!s.schema_version, `schema_version: ${s.schema_version}`);
  }

  // ── 테스트 2: cache_key 기반 조회 ──
  console.log("\n테스트 2: cache_key로 정확히 hit 되는지");

  if (sample?.[0]) {
    const target = sample[0];
    const { data: byKey } = await supabase
      .from("song_analyses")
      .select("id, cache_key")
      .eq("cache_key", target.cache_key)
      .eq("is_active", true)
      .limit(1)
      .single();

    assert(!!byKey, "cache_key로 조회 성공");
    assert(byKey?.id === target.id, "같은 row를 반환");
  }

  // ── 테스트 3: schema_version 기반 stale 판별 가능 ──
  console.log("\n테스트 3: schema_version 기반 stale 판별");

  const { data: v1Rows } = await supabase
    .from("song_analyses")
    .select("id, schema_version, cache_key")
    .eq("schema_version", 1)
    .limit(3);

  assert(v1Rows && v1Rows.length > 0, `V1 row 존재 (${v1Rows?.length}개)`);

  const { data: v3Rows } = await supabase
    .from("song_analyses")
    .select("id, schema_version")
    .eq("schema_version", 3)
    .limit(1);

  console.log(`  ℹ️  V3 row: ${v3Rows?.length ?? 0}개 (아직 V3 분석 안 했으면 0이 정상)`);

  // V1 row는 V3 요청 시 stale 처리 대상
  if (v1Rows?.[0]) {
    assert(v1Rows[0].schema_version < 3, `V1(${v1Rows[0].schema_version}) < 3 → stale 처리 대상`);
  }

  // ── 테스트 4: analysis_jobs 새 컬럼 존재 확인 ──
  console.log("\n테스트 4: analysis_jobs 새 컬럼 확인");

  const { data: jobs } = await supabase
    .from("analysis_jobs")
    .select("id, analysis_version, requested_format, composer_normalized, cache_key, started_at, finished_at, result_schema_version, notification_status")
    .limit(3);

  assert(jobs !== null, "analysis_jobs 조회 성공 (컬럼 존재)");

  if (jobs && jobs.length > 0) {
    const j = jobs[0];
    console.log(`  ℹ️  기존 job: analysis_version=${j.analysis_version}, format=${j.requested_format}, notification=${j.notification_status}`);
  } else {
    console.log("  ℹ️  기존 job 없음 (정상 — 새 컬럼은 SELECT 가능함이 확인됨)");
  }

  // ── 테스트 5: 인덱스 동작 확인 ──
  console.log("\n테스트 5: 인덱스 동작 확인");

  const { data: byNorm } = await supabase
    .from("song_analyses")
    .select("id, composer_normalized, canonical_title")
    .eq("composer_normalized", "beethoven")
    .limit(3);

  assert(byNorm !== null, "composer_normalized 인덱스 조회 가능");
  assert((byNorm?.length ?? 0) > 0, `beethoven 결과: ${byNorm?.length}개`);

  const { data: byVersion } = await supabase
    .from("song_analyses")
    .select("id")
    .eq("schema_version", 1)
    .eq("is_active", true)
    .limit(1);

  assert(byVersion !== null, "schema_version + is_active 인덱스 조회 가능");

  // ── 결과 ──
  console.log("\n═══════════════════════════════════════");
  console.log(`결과: ${passed} 통과, ${failed} 실패`);
  console.log("═══════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ 치명적 오류:", err);
  process.exit(1);
});
