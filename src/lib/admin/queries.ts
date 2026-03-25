import type { DashboardStats, AdminUser, MusicDBItem, RankingEntry } from './types';

/**
 * 어드민 쿼리 — 서버 API를 통해 service role로 조회
 * 클라이언트 사이드 supabase (anon key)는 RLS에 막히므로 사용하지 않음
 */

// ─── 대시보드 통계 ───

export async function getDashboardStats(): Promise<DashboardStats & { recentSignups?: unknown[] }> {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) {
    return {
      totalUsers: 0, activeUsersToday: 0, weeklyActiveUsers: 0,
      totalPracticeSessions: 0, avgDailyPracticeMinutes: 0,
      totalSongAnalyses: 0, totalTeachers: 0, pendingVerifications: 0,
    };
  }
  return res.json();
}

// ─── 사용자 목록 ───

export async function getUsers(limit = 100, offset = 0): Promise<AdminUser[]> {
  const res = await fetch(`/api/admin/users?limit=${limit}&offset=${offset}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.users ?? [];
}

// ─── 사용자 상세 ───

export async function getUserDetail(userId: string) {
  const res = await fetch(`/api/admin/users/${userId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? null;
}

// ─── WAU 추이 ───

export async function getWAUTrend(): Promise<{ week: string; users: number }[]> {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) return [];
  // TODO: 별도 WAU API 추가 시 교체
  return [];
}

// ─── 선생님 목록 ───

export async function getTeachers() {
  const res = await fetch("/api/admin/teachers");
  if (!res.ok) return [];
  const data = await res.json();
  return data.teachers ?? [];
}

// ─── 곡 DB ───

export async function getMusicDB(): Promise<MusicDBItem[]> {
  // 서버 API 미구현 시 빈 배열
  return [];
}

export async function getSongAnalyses() {
  return [];
}

// ─── 랭킹 ───

export async function getRankings(date?: string): Promise<RankingEntry[]> {
  return [];
}

// ─── CS ───

export async function getFeedbackRequests() {
  return [];
}

export async function getFeedbacks() {
  return [];
}

// ─── 기타 ───

export async function getContentStats() {
  return { recordings: [], videos: [] };
}

export async function getRecordings() {
  return [];
}

export async function getRoomVideos() {
  return [];
}

export async function getSupportStats() {
  return [];
}
