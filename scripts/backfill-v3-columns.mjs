/**
 * Backfill 스크립트 — 기존 song_analyses row에 새 컬럼 값 채우기
 *
 * 사용법:
 *   node scripts/backfill-v3-columns.mjs
 *
 * .env.local에서 NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY를 읽음
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 파싱
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ .env.local에 NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ── 정규화 헬퍼 ──

function normalizeComposer(name) {
  if (!name) return null;
  // 성(last name)만 소문자로 추출
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

function createCacheKey(composer, title) {
  if (!composer || !title) return null;
  const c = composer.toLowerCase().trim().replace(/\s+/g, "_");
  const t = title.toLowerCase().trim().replace(/\s+/g, "_");
  return `${c}__${t}`;
}

function inferWorkType(title, content) {
  if (!title) return null;
  const lower = title.toLowerCase();

  // 변주곡
  const variationKw = ["variation", "변주", "goldberg", "diabelli", "enigma", "chaconne", "passacaglia"];
  if (variationKw.some((k) => lower.includes(k))) return "variation_set";

  // 모음곡/소품집
  const collectionKw = [
    "pictures at an exhibition", "kinderszenen", "carnaval", "kreisleriana",
    "papillons", "annees de pelerinage", "preludes op.28", "well-tempered",
    "songs without words", "moments musicaux", "consolations", "liebestraume",
    "etudes-tableaux", "gaspard de la nuit", "miroirs", "children's corner",
    "suite bergamasque", "gymnopedies", "gnossiennes",
  ];
  if (collectionKw.some((k) => lower.includes(k))) return "suite_or_collection";

  // 다악장
  const multiKw = ["sonata", "sonatina", "concerto", "symphony", "trio", "quartet", "quintet", "suite", "partita"];
  if (multiKw.some((k) => lower.includes(k))) return "multi_movement_sonata";

  // content 내부에 movements가 있으면 다악장
  if (content?.structure_analysis_v2?.movements?.length > 0) return "multi_movement_sonata";

  return "single_movement_piece";
}

function inferSchemaVersion(row) {
  // 이미 DB에 schema_version이 있으면 사용
  if (row.schema_version) return row.schema_version;

  const content = row.content;
  if (!content) return 1;

  // V3: schema_version === 3 이고 content 안에 work_type이 있음
  if (content.schema_version === 3) return 3;

  // V2: song_overview 또는 composer_life 존재
  const inner = content.content || content;
  if (inner && (inner.song_overview || inner.composer_life)) return 2;

  return 1;
}

// ── 메인 ──

async function main() {
  console.log("📦 song_analyses backfill 시작...\n");

  // 전체 row 읽기
  const { data: rows, error } = await supabase
    .from("song_analyses")
    .select("id, composer, title, opus, key, content, schema_version, content_format, composer_normalized, canonical_title, cache_key");

  if (error) {
    console.error("❌ 조회 실패:", error.message);
    process.exit(1);
  }

  console.log(`총 ${rows.length}개 row 발견\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const content = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
      const schemaVersion = inferSchemaVersion({ ...row, content });

      // V3 vs legacy 분기
      let composerDisplay, titleDisplay, opus, workType, instrument;

      if (schemaVersion === 3 && content?.meta?.work) {
        // V3: meta.work 기준
        const work = content.meta.work;
        composerDisplay = work.composer_display || row.composer;
        titleDisplay = work.canonical_title || row.title;
        opus = work.opus_catalogue || row.opus || null;
        workType = content.content?.work_type || inferWorkType(titleDisplay, null);
        instrument = null; // V3 content에 instrument 없으면 null
      } else {
        // Legacy: meta.composer, meta.title 기준
        const meta = content?.meta || {};
        composerDisplay = meta.composer || row.composer;
        titleDisplay = meta.title || row.title;
        opus = meta.opus || row.opus || null;

        const innerContent = content?.content || content || {};
        workType = inferWorkType(titleDisplay, innerContent);
        instrument = null; // legacy에는 instrument 정보 없음
      }

      const composerNormalized = normalizeComposer(composerDisplay);
      const cacheKey = createCacheKey(composerDisplay, titleDisplay);
      const contentFormat = schemaVersion === 3 ? "v3_coaching" : "legacy";

      // 이미 채워져 있으면 스킵
      if (row.composer_normalized && row.canonical_title && row.cache_key) {
        skipped++;
        continue;
      }

      const updateData = {
        schema_version: schemaVersion,
        content_format: contentFormat,
        composer_normalized: composerNormalized,
        canonical_title: titleDisplay,
        opus_catalogue: opus,
        work_type: workType,
        instrument: instrument || "piano",
        cache_key: cacheKey,
        is_active: true,
        analysis_quality_status: "pending",
      };

      const { error: updateError } = await supabase
        .from("song_analyses")
        .update(updateData)
        .eq("id", row.id);

      if (updateError) {
        console.error(`  ❌ ${row.id} (${composerDisplay} - ${titleDisplay}): ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✅ ${composerDisplay} - ${titleDisplay} | v${schemaVersion} | ${workType}`);
        updated++;
      }
    } catch (err) {
      console.error(`  ❌ ${row.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n완료: ${updated} 업데이트, ${skipped} 스킵, ${failed} 실패 (총 ${rows.length}개)`);

  // 결과 확인
  const { data: sample } = await supabase
    .from("song_analyses")
    .select("composer, canonical_title, composer_normalized, cache_key, schema_version, work_type")
    .not("cache_key", "is", null)
    .limit(5);

  if (sample?.length) {
    console.log("\n샘플 확인:");
    for (const s of sample) {
      console.log(`  ${s.composer} → ${s.composer_normalized} | ${s.canonical_title} | v${s.schema_version} | ${s.work_type} | key: ${s.cache_key?.slice(0, 40)}...`);
    }
  }
}

main().catch((err) => {
  console.error("❌ 치명적 오류:", err);
  process.exit(1);
});
