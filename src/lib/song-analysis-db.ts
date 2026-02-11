import { promises as fs } from "fs";
import path from "path";
import type { SongAnalysis, SongAnalysisCache } from "@/types/song-analysis";

/** 캐시 파일 경로 */
const CACHE_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(CACHE_DIR, "song-analysis-cache.json");

/** 캐시 키 생성 (작곡가_제목 형식) */
export function createCacheKey(composer: string, title: string): string {
  const normalizedComposer = composer.toLowerCase().trim().replace(/\s+/g, "_");
  const normalizedTitle = title.toLowerCase().trim().replace(/\s+/g, "_");
  return `${normalizedComposer}__${normalizedTitle}`;
}

/** 캐시 디렉토리 생성 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

/** 전체 캐시 읽기 */
async function readCache(): Promise<SongAnalysisCache> {
  try {
    await ensureCacheDir();
    const data = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    // 파일이 없거나 파싱 에러 시 빈 캐시 반환
    return {};
  }
}

/** 전체 캐시 저장 */
async function writeCache(cache: SongAnalysisCache): Promise<void> {
  await ensureCacheDir();
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

/** 캐시에서 분석 데이터 조회 */
export async function getCachedAnalysis(
  composer: string,
  title: string
): Promise<SongAnalysis | null> {
  const cache = await readCache();
  const key = createCacheKey(composer, title);
  return cache[key] || null;
}

/** 캐시에 분석 데이터 저장 */
export async function saveCachedAnalysis(
  analysis: SongAnalysis,
  originalComposer?: string,
  originalTitle?: string
): Promise<void> {
  const cache = await readCache();

  // 원본 키로 저장 (요청 시 사용한 작곡가/제목)
  if (originalComposer && originalTitle) {
    const originalKey = createCacheKey(originalComposer, originalTitle);
    cache[originalKey] = {
      ...analysis,
      updated_at: new Date().toISOString(),
    };
  }

  // AI가 반환한 메타 정보로도 저장 (다양한 검색 지원)
  const metaKey = createCacheKey(analysis.meta.composer, analysis.meta.title);
  cache[metaKey] = {
    ...analysis,
    updated_at: new Date().toISOString(),
  };

  await writeCache(cache);
}

/** 캐시에서 분석 데이터 삭제 */
export async function deleteCachedAnalysis(
  composer: string,
  title: string
): Promise<boolean> {
  const cache = await readCache();
  const key = createCacheKey(composer, title);
  if (cache[key]) {
    delete cache[key];
    await writeCache(cache);
    return true;
  }
  return false;
}

/** 캐시된 모든 분석 목록 조회 */
export async function getAllCachedAnalyses(): Promise<SongAnalysis[]> {
  const cache = await readCache();
  return Object.values(cache).sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/** 캐시 통계 */
export async function getCacheStats(): Promise<{
  totalCount: number;
  verifiedCount: number;
  needsReviewCount: number;
}> {
  const cache = await readCache();
  const analyses = Object.values(cache);
  return {
    totalCount: analyses.length,
    verifiedCount: analyses.filter(a => a.verification_status === "Verified").length,
    needsReviewCount: analyses.filter(a => a.verification_status === "Needs Review").length,
  };
}

/** 검증 상태 업데이트 */
export async function updateVerificationStatus(
  composer: string,
  title: string,
  status: SongAnalysis["verification_status"]
): Promise<boolean> {
  const cache = await readCache();
  const key = createCacheKey(composer, title);
  if (cache[key]) {
    cache[key].verification_status = status;
    cache[key].updated_at = new Date().toISOString();
    await writeCache(cache);
    return true;
  }
  return false;
}
