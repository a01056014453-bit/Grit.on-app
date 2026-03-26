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
  return (data.users ?? []).map((u: Record<string, unknown>) => ({
    id: u.id as string,
    nickname: u.nickname as string,
    name: u.name as string | null,
    instrument: u.instrument as string,
    level: u.level as string | null,
    gritScore: u.gritScore as number | null,
    totalPracticeHours: u.totalPracticeHours as number | null,
    streakDays: u.streakDays as number | null,
    createdAt: u.createdAt as string,
    lastActiveAt: u.updatedAt as string | null,
    subscription: "free" as const,
    pushEnabled: false,
    email: u.email as string | null,
    authProvider: u.authProvider as string | null,
    sessionCount: u.sessionCount as number,
  }));
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
  const data = await res.json();
  return data.wauTrend ?? [];
}

// ─── 선생님 목록 ───

export async function getTeachers() {
  const res = await fetch("/api/admin/teachers");
  if (!res.ok) return [];
  const data = await res.json();
  return data.teachers ?? [];
}

// ─── 분석 데이터 ───

export async function getAnalytics() {
  const res = await fetch("/api/admin/analytics");
  if (!res.ok) return { eventCounts: {}, dauTrend: [], deviceBreakdown: {}, pwaInstallCount: 0 };
  return res.json();
}

// ─── App Store 데이터 ───

export async function getAppStoreStats() {
  const res = await fetch("/api/admin/appstore");
  if (!res.ok) return { configured: false, downloads: null, appInfo: null };
  return res.json();
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
