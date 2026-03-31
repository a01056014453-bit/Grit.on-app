import { supabaseServer } from "@/lib/supabase-server";
import type { SongAnalysis, AnySongAnalysis, SongAnalysisV3 } from "@/types/song-analysis";
import type { Json } from "@/types/database";

const supabase = supabaseServer;

/** 캐시 키 생성 (작곡가_제목 형식) - 검색용 정규화 */
export function createCacheKey(composer: string, title: string): string {
  const normalizedComposer = composer.toLowerCase().trim().replace(/\s+/g, "_");
  const normalizedTitle = title.toLowerCase().trim().replace(/\s+/g, "_");
  return `${normalizedComposer}__${normalizedTitle}`;
}

/** 공유 캐시에서 분석 데이터 조회 (작곡가 + 제목) — user_id 무관
 *  1차: cache_key 정확 매칭 (is_active = true)
 *  2차: ilike 매칭 (기존 호환)
 *  3차: 부분 매칭 (성 + 제목 일부)
 *  V3 데이터(schema_version === 3)는 SongAnalysisV3로 unwrap하여 반환 */
export async function getCachedAnalysis(
  composer: string,
  title: string
): Promise<AnySongAnalysis | null> {
  try {
    // 1차: cache_key 정확 매칭
    const cacheKey = createCacheKey(composer, title);
    const { data: byKey } = await supabase
      .from("song_analyses")
      .select("*")
      .eq("cache_key", cacheKey)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (byKey) return reconstructAnalysis(byKey);

    // 2차: ilike 매칭 (기존 호환)
    const { data, error } = await supabase
      .from("song_analyses")
      .select("*")
      .ilike("composer", composer.trim())
      .ilike("title", title.trim())
      .limit(1)
      .single();

    if (!error && data) return reconstructAnalysis(data);

    // 3차: 부분 매칭 (작곡가 성 + 제목 일부)
    const composerParts = composer.trim().split(" ");
    const lastName = composerParts[composerParts.length - 1];

    const { data: partialData, error: partialError } = await supabase
      .from("song_analyses")
      .select("*")
      .ilike("composer", `%${lastName}%`)
      .ilike("title", `%${title.trim()}%`)
      .limit(1)
      .single();

    if (partialError || !partialData) return null;

    return reconstructAnalysis(partialData);
  } catch (err) {
    console.error("[Supabase] getCachedAnalysis error:", err);
    return null;
  }
}

/** DB row에서 SongAnalysis 또는 SongAnalysisV3 객체 복원 */
function reconstructAnalysis(row: {
  id: string;
  composer: string;
  title: string;
  content: unknown;
  key: string | null;
  opus: string | null;
  difficulty_level: string | null;
  verification_status: string | null;
  created_at: string | null;
  updated_at: string | null;
}): AnySongAnalysis {
  const content = row.content as Record<string, unknown>;

  if (content && content.meta && content.content) {
    // V3 감지: schema_version === 3이고 content 안에 work_type이 있으면 V3
    const schemaVer = content.schema_version;
    if (schemaVer === 3) {
      const v3Inner = content.content as Record<string, unknown>;
      if (v3Inner && "work_type" in v3Inner) {
        // V3 unwrap — 래퍼 content 안에 저장된 SongAnalysisV3를 꺼냄
        const v3 = content as unknown as SongAnalysisV3;
        return {
          ...v3,
          id: row.id,
          created_at: row.created_at || v3.created_at,
          updated_at: row.updated_at || v3.updated_at,
        };
      }
    }

    // V1/V2 복원
    const base = content as unknown as SongAnalysis;
    const c = base.content as unknown as Record<string, unknown>;
    const schemaVersion = base.schema_version || ((c && ('song_overview' in c || 'composer_life' in c)) ? 2 : 1);
    return {
      ...base,
      id: row.id,
      updated_at: row.updated_at || base.updated_at,
      created_at: row.created_at || base.created_at,
      schema_version: schemaVersion,
    };
  }

  return {
    id: row.id,
    meta: {
      composer: row.composer,
      title: row.title,
      opus: row.opus || "",
      key: row.key || "",
      difficulty_level: (row.difficulty_level as SongAnalysis["meta"]["difficulty_level"]) || "Intermediate",
    },
    content: content as unknown as SongAnalysis["content"],
    verification_status: (row.verification_status as SongAnalysis["verification_status"]) || "Needs Review",
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    schema_version: 1,
  };
}

/** 정규화 작곡가명 (검색/캐시 키용) */
function normalizeComposer(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

/** 공유 캐시에 분석 데이터 저장 (user_id 없음) */
export async function saveCachedAnalysis(
  analysis: SongAnalysis,
  originalComposer?: string,
  originalTitle?: string,
): Promise<void> {
  try {
    const composer = analysis.meta.composer;
    const title = analysis.meta.title;
    const schemaVer = analysis.schema_version ?? 1;

    // V3 메타 추출 (래퍼 content 안에 V3가 들어있는 경우)
    const contentAny = analysis.content as unknown as Record<string, unknown>;
    const isV3Wrapped = schemaVer === 3 && contentAny && "meta" in contentAny;
    const v3Work = isV3Wrapped
      ? (contentAny as { meta?: { work?: Record<string, unknown> } }).meta?.work
      : null;
    const v3Content = isV3Wrapped
      ? (contentAny as { content?: Record<string, unknown> }).content
      : null;

    // 새 컬럼 값 계산
    const composerNormalized = v3Work?.composer_normalized as string
      ?? normalizeComposer(composer);
    const canonicalTitle = v3Work?.canonical_title as string ?? title;
    const opusCatalogue = v3Work?.opus_catalogue as string ?? analysis.meta.opus ?? null;
    const workType = v3Content?.work_type as string ?? null;
    const cacheKey = createCacheKey(composer, title);
    const contentFormat = schemaVer === 3 ? "v3_coaching" : "legacy";

    // V3 전용 컬럼
    const workNumber = v3Work?.work_number as number ?? null;
    const sourceWorkId = v3Work?.source_work_id as string ?? null;

    // 공통 새 컬럼
    const newColumns = {
      schema_version: schemaVer,
      content_format: contentFormat,
      composer_normalized: composerNormalized,
      canonical_title: canonicalTitle,
      opus_catalogue: opusCatalogue,
      work_number: workNumber,
      source_work_id: sourceWorkId,
      work_type: workType,
      cache_key: cacheKey,
      is_active: true,
    };

    // 이미 존재하는지 확인 — cache_key 우선, 없으면 ilike fallback
    let existingId: string | null = null;
    const { data: byCacheKey } = await supabase
      .from("song_analyses")
      .select("id")
      .eq("cache_key", cacheKey)
      .limit(1)
      .single();

    if (byCacheKey) {
      existingId = byCacheKey.id;
    } else {
      const { data: byIlike } = await supabase
        .from("song_analyses")
        .select("id")
        .ilike("composer", composer.trim())
        .ilike("title", title.trim())
        .limit(1)
        .single();
      if (byIlike) existingId = byIlike.id;
    }

    if (existingId) {
      const { error } = await supabase
        .from("song_analyses")
        .update({
          content: analysis as unknown as Json,
          key: analysis.meta.key || null,
          opus: analysis.meta.opus || null,
          difficulty_level: analysis.meta.difficulty_level,
          verification_status: analysis.verification_status,
          updated_at: new Date().toISOString(),
          ...newColumns,
        })
        .eq("id", existingId);

      if (error) {
        console.error("[Supabase] update error:", error.message);
      } else {
        analysis.id = existingId;
        console.log(`[Supabase] Updated: ${composer} - ${title} | v${schemaVer} | cache_key: ${cacheKey}`);
      }
    } else {
      const insertData: Record<string, unknown> = {
        composer: composer.trim(),
        title: title.trim(),
        content: analysis as unknown as Json,
        key: analysis.meta.key || null,
        opus: analysis.meta.opus || null,
        difficulty_level: analysis.meta.difficulty_level,
        verification_status: analysis.verification_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...newColumns,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error } = await (supabase as any)
        .from("song_analyses")
        .insert(insertData)
        .select("id")
        .single();

      if (error) {
        console.error("[Supabase] insert error:", error.message);
      } else {
        if (inserted?.id) {
          analysis.id = inserted.id;
        }
        console.log(`[Supabase] Saved: ${composer} - ${title} | v${schemaVer} | cache_key: ${cacheKey} (id: ${inserted?.id})`);
      }
    }

    // 원본 키가 다르면 기존 원본 키 row 삭제 (중복 방지)
    if (
      originalComposer &&
      originalTitle &&
      (originalComposer.trim().toLowerCase() !== composer.trim().toLowerCase() ||
        originalTitle.trim().toLowerCase() !== title.trim().toLowerCase())
    ) {
      await supabase
        .from("song_analyses")
        .delete()
        .ilike("composer", originalComposer.trim())
        .ilike("title", originalTitle.trim());
      console.log(`[Supabase] Cleaned duplicate: ${originalComposer} - ${originalTitle}`);
    }
  } catch (error) {
    console.error("[Supabase] saveCachedAnalysis error:", error);
  }
}

/** ID 기반 분석 데이터 업데이트 (어드민/서버 전용) */
export async function updateAnalysisById(
  id: string,
  analysis: SongAnalysis
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("song_analyses")
      .update({
        content: analysis as unknown as Json,
        composer: analysis.meta.composer.trim(),
        title: analysis.meta.title.trim(),
        key: analysis.meta.key || null,
        opus: analysis.meta.opus || null,
        difficulty_level: analysis.meta.difficulty_level,
        verification_status: analysis.verification_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("[Supabase] updateAnalysisById error:", error.message);
      return false;
    }
    console.log(`[Supabase] Updated by ID: ${id}`);
    return true;
  } catch (error) {
    console.error("[Supabase] updateAnalysisById error:", error);
    return false;
  }
}

/** 공유 캐시에서 분석 데이터 삭제 (어드민/서버 전용) */
export async function deleteCachedAnalysis(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("song_analyses")
      .delete()
      .eq("id", id);

    return !error;
  } catch (err) {
    console.error("[Supabase] deleteCachedAnalysis error:", err);
    return false;
  }
}

/** 전체 분석 목록 조회 (어드민용) */
export async function getAllCachedAnalyses(): Promise<AnySongAnalysis[]> {
  try {
    const { data, error } = await supabase
      .from("song_analyses")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error || !data) {
      console.error("[Supabase] getAllCachedAnalyses error:", error?.message);
      return [];
    }

    const analyses = data.map(reconstructAnalysis);
    const seen = new Set<string>();
    return analyses.filter((a) => {
      const key = a.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (err) {
    console.error("[Supabase] getAllCachedAnalyses error:", err);
    return [];
  }
}

// ============================================================
// user_analysis_history — 개인 분석함
// ============================================================

/** 사용자의 분석 히스토리 조회 (개인 보관함) */
export async function getUserAnalysisHistory(userId: string): Promise<AnySongAnalysis[]> {
  if (!userId) return [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("user_analysis_history")
      .select(`
        requested_at,
        song_analyses (*)
      `)
      .eq("user_id", userId)
      .order("requested_at", { ascending: false });

    if (error || !data) {
      console.error("[Supabase] getUserAnalysisHistory error:", error?.message);
      return [];
    }

    return (data as { requested_at: string; song_analyses: Record<string, unknown> }[])
      .filter((row) => row.song_analyses)
      .map((row) => reconstructAnalysis(row.song_analyses as Parameters<typeof reconstructAnalysis>[0]));
  } catch (err) {
    console.error("[Supabase] getUserAnalysisHistory error:", err);
    return [];
  }
}

/** 사용자 분석 히스토리에 추가 (중복 시 무시) */
export async function addToUserHistory(
  userId: string,
  songAnalysisId: string
): Promise<void> {
  if (!userId || !songAnalysisId) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("user_analysis_history")
      .upsert(
        { user_id: userId, song_analysis_id: songAnalysisId },
        { onConflict: "user_id,song_analysis_id" }
      );
  } catch (err) {
    console.error("[Supabase] addToUserHistory error:", err);
  }
}

/** 사용자 분석 히스토리에서 제거 */
export async function removeFromUserHistory(
  userId: string,
  songAnalysisId: string
): Promise<boolean> {
  if (!userId || !songAnalysisId) return false;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("user_analysis_history")
      .delete()
      .eq("user_id", userId)
      .eq("song_analysis_id", songAnalysisId);

    return !error;
  } catch (err) {
    console.error("[Supabase] removeFromUserHistory error:", err);
    return false;
  }
}

/** 하루 분석 횟수 체크 (Free 유저 제한용) */
export async function checkDailyLimit(userId: string): Promise<boolean> {
  if (!userId) return false;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from("user_analysis_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("requested_at", todayStart.toISOString());

    return (count ?? 0) === 0;
  } catch (err) {
    console.error("[Supabase] checkDailyLimit error:", err);
    return true; // 에러 시 허용
  }
}

/** 캐시 통계 (어드민용) */
export async function getCacheStats(): Promise<{
  totalCount: number;
  verifiedCount: number;
  needsReviewCount: number;
}> {
  try {
    const { count: totalCount } = await supabase
      .from("song_analyses")
      .select("*", { count: "exact", head: true });

    const { count: verifiedCount } = await supabase
      .from("song_analyses")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "Verified");

    const { count: needsReviewCount } = await supabase
      .from("song_analyses")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "Needs Review");

    return {
      totalCount: totalCount || 0,
      verifiedCount: verifiedCount || 0,
      needsReviewCount: needsReviewCount || 0,
    };
  } catch (err) {
    console.error("[Supabase] getCacheStats error:", err);
    return { totalCount: 0, verifiedCount: 0, needsReviewCount: 0 };
  }
}

/** 검증 상태 업데이트 (어드민용) */
export async function updateVerificationStatus(
  composer: string,
  title: string,
  status: SongAnalysis["verification_status"]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("song_analyses")
      .update({
        verification_status: status,
        updated_at: new Date().toISOString(),
      })
      .ilike("composer", composer.trim())
      .ilike("title", title.trim());

    return !error;
  } catch (err) {
    console.error("[Supabase] updateVerificationStatus error:", err);
    return false;
  }
}
