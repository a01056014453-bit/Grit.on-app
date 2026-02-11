// localStorage 기반 곡 분석 기록 저장소

export interface AnalyzedSong {
  id: string;
  title: string;
  opus?: string;
  composer: string;
  analyzedAt: string; // ISO date string
}

const STORAGE_KEY = "grit-on-analyzed-songs";

// 분석된 곡 목록 가져오기
export function getAnalyzedSongs(): AnalyzedSong[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 분석된 곡 추가/업데이트
export function saveAnalyzedSong(song: Omit<AnalyzedSong, "analyzedAt">): void {
  if (typeof window === "undefined") return;

  const songs = getAnalyzedSongs();
  const existingIndex = songs.findIndex(s => s.id === song.id);

  const newSong: AnalyzedSong = {
    ...song,
    analyzedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    // 이미 있으면 업데이트 (최근 본 것으로)
    songs[existingIndex] = newSong;
  } else {
    // 새로 추가
    songs.unshift(newSong);
  }

  // 최대 20개까지만 저장
  const trimmed = songs.slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

// 최근 분석한 곡 가져오기 (최근순 정렬)
export function getRecentAnalyzedSongs(limit: number = 5): AnalyzedSong[] {
  const songs = getAnalyzedSongs();
  return songs
    .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
    .slice(0, limit);
}

// 분석 기록 삭제
export function removeAnalyzedSong(id: string): void {
  if (typeof window === "undefined") return;

  const songs = getAnalyzedSongs();
  const filtered = songs.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// 이미 분석된 곡인지 확인
export function isAlreadyAnalyzed(id: string): boolean {
  const songs = getAnalyzedSongs();
  return songs.some(s => s.id === id);
}
