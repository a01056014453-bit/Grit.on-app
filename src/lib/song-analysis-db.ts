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

/** 공유 캐시에서 분석 데이터 조회 (작곡가 + 제목) — user_id 무관 */
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
  } catch (err) {
    console.error("[Supabase] getCachedAnalysis error:", err);
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
  const content = row.content as Record<string, unknown>;

  if (content && content.meta && content.content) {
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

/** 공유 캐시에 분석 데이터 저장 (user_id 없음) */
export async function saveCachedAnalysis(
  analysis: SongAnalysis,
  originalComposer?: string,
  originalTitle?: string,
): Promise<void> {
  try {
    const composer = analysis.meta.composer;
    const title = analysis.meta.title;

    // 이미 존재하는지 확인 (같은 곡)
    const { data: existing } = await supabase
      .from("song_analyses")
      .select("id")
      .ilike("composer", composer.trim())
      .ilike("title", title.trim())
      .limit(1)
      .single();

    if (existing) {
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
        analysis.id = existing.id;
        console.log(`[Supabase] Updated: ${composer} - ${title}`);
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
        console.log(`[Supabase] Saved: ${composer} - ${title} (id: ${inserted?.id})`);
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
  } catch {
    return false;
  }
}

/** 전체 분석 목록 조회 (어드민용) */
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

// ============================================================
// user_analysis_history — 개인 분석함
// ============================================================

/** 사용자의 분석 히스토리 조회 (개인 보관함) */
export async function getUserAnalysisHistory(userId: string): Promise<SongAnalysis[]> {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
    return false;
  }
}
