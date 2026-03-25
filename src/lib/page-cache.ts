/**
 * 페이지 데이터 캐시 유틸 (Stale-While-Revalidate)
 *
 * 패턴:
 * 1. localStorage 캐시에서 즉시 반환
 * 2. 백그라운드에서 서버 최신 데이터 가져오기
 * 3. 캐시 갱신
 */

const MAX_CACHE_AGE_MS = 5 * 60 * 1000; // 5분 (이보다 오래된 캐시는 stale 표시)

export interface CachedData<T> {
  data: T;
  timestamp: number;
}

/** 캐시에서 즉시 로드 */
export function getCachedPageData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const cached: CachedData<T> = JSON.parse(raw);
    return cached.data;
  } catch {
    return null;
  }
}

/** 캐시에 저장 */
export function setCachedPageData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const cached: CachedData<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // 용량 초과 등 무시
  }
}

/** 캐시 나이 확인 (ms) */
export function getCacheAge(key: string): number {
  if (typeof window === "undefined") return Infinity;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return Infinity;
    const cached = JSON.parse(raw);
    return Date.now() - (cached.timestamp || 0);
  } catch {
    return Infinity;
  }
}

/** 캐시가 stale인지 (5분 이상) */
export function isCacheStale(key: string): boolean {
  return getCacheAge(key) > MAX_CACHE_AGE_MS;
}
