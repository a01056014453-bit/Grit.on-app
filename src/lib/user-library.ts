/**
 * 사용자 개인 곡 보관함 관리 (localStorage 기반)
 * - 관리자 DB(song_analyses)는 전역 분석 캐시
 * - 사용자 보관함은 사용자가 직접 분석/추가한 곡만 표시
 */

const LIBRARY_KEY = "grit-on-my-library";

/** 정규화된 키 생성 (composer__title) */
function normalizeKey(composer: string, title: string): string {
  return `${composer.trim().toLowerCase()}__${title.trim().toLowerCase()}`;
}

/** 보관함 목록 가져오기 */
function getLibrarySet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

/** 보관함 저장 */
function saveLibrarySet(set: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIBRARY_KEY, JSON.stringify([...set]));
}

/** 곡을 보관함에 추가 */
export function addToLibrary(composer: string, title: string): void {
  const set = getLibrarySet();
  set.add(normalizeKey(composer, title));
  saveLibrarySet(set);
}

/** 곡을 보관함에서 제거 */
export function removeFromLibrary(composer: string, title: string): void {
  const set = getLibrarySet();
  set.delete(normalizeKey(composer, title));
  saveLibrarySet(set);
}

/** 곡이 보관함에 있는지 확인 */
export function isInLibrary(composer: string, title: string): boolean {
  return getLibrarySet().has(normalizeKey(composer, title));
}

/** 보관함에 있는 곡 키 목록 */
export function getLibraryKeys(): Set<string> {
  return getLibrarySet();
}

/** SongAnalysis 배열에서 보관함에 있는 곡만 필터 */
export function filterByLibrary<T extends { meta: { composer: string; title: string } }>(
  analyses: T[]
): T[] {
  const set = getLibrarySet();
  if (set.size === 0) return [];
  return analyses.filter((a) => set.has(normalizeKey(a.meta.composer, a.meta.title)));
}
