/** 분석한 곡 localStorage 관리 */

export interface AnalyzedSong {
  id: string;
  composer: string;
  title: string;
  fullTitle: string;
  date: string;
}

const STORAGE_KEY = "griton-analyzed-songs";

function getToday(): string {
  const now = new Date();
  const diff = Date.now() - now.setHours(0, 0, 0, 0);
  if (diff < 86400000) return "오늘";
  return `${now.getMonth() + 1}/${now.getDate()}`;
}

export function getAnalyzedSongs(): AnalyzedSong[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAnalyzedSong(composer: string, title: string, id: string): void {
  if (typeof window === "undefined") return;
  const songs = getAnalyzedSongs();

  // 중복 제거 (같은 곡이면 날짜만 업데이트)
  const filtered = songs.filter(
    (s) => !(s.composer === composer && s.title === title)
  );

  filtered.unshift({
    id,
    composer,
    title,
    fullTitle: `${composer} ${title}`,
    date: getToday(),
  });

  // 최대 50곡 저장
  const trimmed = filtered.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function removeAnalyzedSong(id: string): void {
  if (typeof window === "undefined") return;
  const songs = getAnalyzedSongs();
  const filtered = songs.filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
