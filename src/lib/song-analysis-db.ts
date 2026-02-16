import { supabaseServer } from "@/lib/supabase-server";
import type { SongAnalysis } from "@/types/song-analysis";
import type { Json } from "@/types/database";

const supabase = supabaseServer;

/** 캐시 키 생성 (작곡가_제목 형식) - 검색용 정규화 */
export function createCacheKey(composer: string, title: string): string {
  const normalizedComposer = composer.toLowerCase().trim().replace(/\s+/g, "_");
  const normalizedTitle = title.toLowerCase().trim().replace(/\s+/g, "_");
  return `${normalizedComposer}__${normalizedTitle}`;
}

/** Supabase에서 분석 데이터 조회 (작곡가 + 제목으로 검색) */
export async function getCachedAnalysis(
  composer: string,
  title: string
): Promise<SongAnalysis | null> {
  try {
    // 정확한 매칭 시도 (case-insensitive)
    const { data, error } = await supabase
      .from("song_analyses")
      .select("*")
      .ilike("composer", composer.trim())
      .ilike("title", title.trim())
      .limit(1)
      .single();

    if (error || !data) {
      // 부분 매칭 시도 (작곡가 성만으로 검색)
      const composerParts = composer.trim().split(" ");
      const lastName = composerParts[composerParts.length - 1];

      const { data: partialData, error: partialError } = await supabase
        .from("song_analyses")
        .select("*")
        .ilike("composer", `%${lastName}%`)
        .ilike("title", `%${title.trim()}%`)
        .limit(1)
        .single();

      if (partialError || !partialData) {
        return null;
      }

      return reconstructAnalysis(partialData);
    }

    return reconstructAnalysis(data);
  } catch {
    console.error("[Supabase] getCachedAnalysis error");
    return null;
  }
}

/** DB row에서 SongAnalysis 객체 복원 */
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
}): SongAnalysis {
  // content에 전체 SongAnalysis가 저장되어 있으면 그대로 사용
  const content = row.content as Record<string, unknown>;

  if (content && content.meta && content.content) {
    const restored = content as unknown as SongAnalysis;
    // Supabase row ID를 사용 (content 내부 자체 생성 ID 대신)
    restored.id = row.id;
    restored.updated_at = row.updated_at || restored.updated_at;
    restored.created_at = row.created_at || restored.created_at;
    // schema_version이 저장되어 있으면 유지, 없으면 V2 필드 존재 여부로 판단
    if (!restored.schema_version) {
      const c = restored.content as unknown as Record<string, unknown>;
      restored.schema_version = (c && ('song_overview' in c || 'composer_life' in c)) ? 2 : 1;
    }
    return restored;
  }

  // 개별 컬럼에서 복원 (fallback)
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

/** Supabase에 분석 데이터 저장 (upsert) */
export async function saveCachedAnalysis(
  analysis: SongAnalysis,
  originalComposer?: string,
  originalTitle?: string
): Promise<void> {
  try {
    const composer = analysis.meta.composer;
    const title = analysis.meta.title;

    // 이미 존재하는지 확인
    const { data: existing } = await supabase
      .from("song_analyses")
      .select("id")
      .ilike("composer", composer.trim())
      .ilike("title", title.trim())
      .limit(1)
      .single();

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from("song_analyses")
        .update({
          content: analysis as unknown as Json,
          key: analysis.meta.key || null,
          opus: analysis.meta.opus || null,
          difficulty_level: analysis.meta.difficulty_level,
          verification_status: analysis.verification_status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.error("[Supabase] update error:", error.message);
      } else {
        console.log(`[Supabase] Updated: ${composer} - ${title}`);
      }
    } else {
      // 새로 삽입
      const { error } = await supabase
        .from("song_analyses")
        .insert({
          composer: composer.trim(),
          title: title.trim(),
          content: analysis as unknown as Json,
          key: analysis.meta.key || null,
          opus: analysis.meta.opus || null,
          difficulty_level: analysis.meta.difficulty_level,
          verification_status: analysis.verification_status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("[Supabase] insert error:", error.message);
      } else {
        console.log(`[Supabase] Saved: ${composer} - ${title}`);
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

/** ID 기반 분석 데이터 직접 업데이트 (관리자 수정용) */
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

/** 캐시에서 분석 데이터 삭제 (id 기반) */
export async function deleteCachedAnalysis(
  id: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("song_analyses")
      .delete()
      .eq("id", id);

    return !error;
  } catch {
    return false;
  }
}

/** 모든 분석 목록 조회 */
export async function getAllCachedAnalyses(): Promise<SongAnalysis[]> {
  try {
    const { data, error } = await supabase
      .from("song_analyses")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error || !data) {
      console.error("[Supabase] getAllCachedAnalyses error:", error?.message);
      return [];
    }

    // 같은 분석(id)이 여러 키로 저장된 경우 중복 제거
    const analyses = data.map(reconstructAnalysis);
    const seen = new Set<string>();
    return analyses.filter((a) => {
      const key = a.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch {
    console.error("[Supabase] getAllCachedAnalyses error");
    return [];
  }
}

/** 캐시 통계 */
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
  } catch {
    return { totalCount: 0, verifiedCount: 0, needsReviewCount: 0 };
  }
}

/** 검증 상태 업데이트 */
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
  } catch {
    return false;
  }
}
