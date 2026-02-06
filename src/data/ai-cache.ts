/** AI 곡 분석 결과 localStorage 캐시 */

import type { SongAIInfo } from "./mock-songs";

const AI_CACHE_KEY = "griton-ai-analysis-cache";

interface AICacheEntry {
  data: SongAIInfo;
  timestamp: number;
}

type AICache = Record<string, AICacheEntry>;

function getCache(): AICache {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(AI_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: AICache): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage 용량 초과 등
  }
}

/** 곡 ID + 작곡가 + 제목으로 캐시 키 생성 */
function makeCacheKey(composer: string, title: string): string {
  return `${composer.toLowerCase().trim()}::${title.toLowerCase().trim()}`;
}

/** ID로 캐시된 AI 분석 결과 조회 */
export function getCachedAIAnalysis(id: string): SongAIInfo | null {
  const cache = getCache();
  // ID로 직접 매칭
  const entry = cache[id];
  if (entry) return entry.data;

  // 모든 엔트리에서 ID 매칭
  for (const value of Object.values(cache)) {
    if (value.data.id === id) return value.data;
  }
  return null;
}

/** 작곡가 + 곡명으로 캐시된 AI 분석 결과 조회 */
export function getCachedAIAnalysisByComposerTitle(
  composer: string,
  title: string
): SongAIInfo | null {
  const cache = getCache();
  const key = makeCacheKey(composer, title);
  const entry = cache[key];
  return entry ? entry.data : null;
}

/** AI 분석 결과를 캐시에 저장 */
export function setCachedAIAnalysis(
  id: string,
  composer: string,
  title: string,
  data: SongAIInfo
): void {
  const cache = getCache();

  // ID와 작곡가+제목 두 가지 키로 저장
  const entry: AICacheEntry = { data, timestamp: Date.now() };
  cache[id] = entry;
  cache[makeCacheKey(composer, title)] = entry;

  saveCache(cache);
}
