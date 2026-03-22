/** 사용자가 실제로 분석한 곡 ID를 localStorage에서 관리 + Supabase 동기화 */

import { pushUserDataDebounced } from "./sync-user-data";

const USER_ANALYSES_KEY = "sempre-user-analyses";

export interface UserAnalysis {
  id: string;
  composer: string;
  title: string;
  analyzedAt: string;
}

export function getUserAnalyses(): UserAnalysis[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(USER_ANALYSES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as UserAnalysis[];
  } catch {
    return [];
  }
}

export function addUserAnalysis(analysis: Omit<UserAnalysis, "analyzedAt">): void {
  if (typeof window === "undefined") return;
  const list = getUserAnalyses();
  // 중복 방지
  if (list.some((a) => a.id === analysis.id)) return;
  const updated = [
    { ...analysis, analyzedAt: new Date().toISOString() },
    ...list,
  ];
  localStorage.setItem(USER_ANALYSES_KEY, JSON.stringify(updated));
  pushUserDataDebounced(USER_ANALYSES_KEY);
}

export function removeUserAnalysis(id: string): void {
  if (typeof window === "undefined") return;
  const list = getUserAnalyses().filter((a) => a.id !== id);
  localStorage.setItem(USER_ANALYSES_KEY, JSON.stringify(list));
  pushUserDataDebounced(USER_ANALYSES_KEY);
}
