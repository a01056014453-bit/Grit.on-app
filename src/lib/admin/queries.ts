import { supabase } from '@/lib/supabase';
import type { DashboardStats, AdminUser, MusicDBItem, RankingEntry } from './types';

// 1. 대시보드 통계
export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    { count: totalUsers },
    { count: totalSessions },
    { count: totalAnalyses },
    { count: totalTeachers },
    { count: pendingTeachers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('practice_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('song_analyses').select('*', { count: 'exact', head: true }),
    supabase.from('teachers').select('*', { count: 'exact', head: true }),
    supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('verified', false),
  ]);

  const today = new Date().toISOString().split('T')[0];
  const { count: activeToday } = await supabase
    .from('daily_rankings')
    .select('*', { count: 'exact', head: true })
    .eq('date', today);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: weeklyActive } = await supabase
    .from('daily_rankings')
    .select('user_id')
    .gte('date', weekAgo);
  const uniqueWeeklyUsers = new Set(weeklyActive?.map((r) => r.user_id) ?? []).size;

  const { data: recentSessions } = await supabase
    .from('practice_sessions')
    .select('practice_time')
    .gte('start_time', weekAgo);
  const avgMinutes = recentSessions?.length
    ? Math.round(recentSessions.reduce((sum, s) => sum + s.practice_time, 0) / recentSessions.length / 60)
    : 0;

  return {
    totalUsers: totalUsers ?? 0,
    activeUsersToday: activeToday ?? 0,
    weeklyActiveUsers: uniqueWeeklyUsers,
    totalPracticeSessions: totalSessions ?? 0,
    avgDailyPracticeMinutes: avgMinutes,
    totalSongAnalyses: totalAnalyses ?? 0,
    totalTeachers: totalTeachers ?? 0,
    pendingVerifications: pendingTeachers ?? 0,
  };
}

// 3. 사용자 목록
export async function getUsers(limit = 50, offset = 0): Promise<AdminUser[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return (data ?? []).map((p) => ({
    id: p.id,
    nickname: p.nickname,
    name: p.name,
    instrument: p.instrument,
    level: p.level,
    gritScore: p.grit_score,
    totalPracticeHours: p.total_practice_hours,
    streakDays: p.streak_days,
    createdAt: p.created_at ?? '',
    lastActiveAt: p.updated_at,
    subscription: 'free' as const,
    pushEnabled: true,
  }));
}

// 3-1. 사용자 상세
export async function getUserDetail(userId: string) {
  const [{ data: profile }, { data: sessions }, { data: rankings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('practice_sessions').select('*').eq('user_id', userId).order('start_time', { ascending: false }).limit(20),
    supabase.from('daily_rankings').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(30),
  ]);

  if (!profile) return null;

  return {
    id: profile.id,
    nickname: profile.nickname,
    name: profile.name,
    instrument: profile.instrument,
    level: profile.level,
    gritScore: profile.grit_score,
    totalPracticeHours: profile.total_practice_hours,
    streakDays: profile.streak_days,
    createdAt: profile.created_at ?? '',
    lastActiveAt: profile.updated_at,
    subscription: 'free' as const,
    pushEnabled: true,
    currentPiece: profile.current_piece,
    dailyGoal: profile.daily_goal,
    weeklyGoal: profile.weekly_goal,
    practiceSessionCount: sessions?.length ?? 0,
    recentSessions: sessions ?? [],
    rankingHistory: (rankings ?? []).map((r) => ({
      date: r.date,
      rank: r.rank ?? 0,
      gritScore: r.grit_score ?? 0,
    })),
  };
}

// 2. 전문가(교사) 목록
export async function getTeachers() {
  const { data } = await supabase
    .from('teachers')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

// 4. 곡 DB
export async function getMusicDB(): Promise<MusicDBItem[]> {
  const { data: pieces } = await supabase
    .from('pieces')
    .select('*')
    .order('created_at', { ascending: false });

  return (pieces ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    composer: p.composer_short_name,
    key: p.key,
    opus: p.opus,
    analysisStatus: p.analysis_status ?? 'pending',
    difficulty: null,
    practiceCount: 0,
    createdAt: p.created_at ?? '',
  }));
}

// 4. 곡 분석 데이터
export async function getSongAnalyses() {
  const { data } = await supabase
    .from('song_analyses')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

// 5. 랭킹
export async function getRankings(date?: string): Promise<RankingEntry[]> {
  const targetDate = date ?? new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('daily_rankings')
    .select('*, profiles(nickname)')
    .eq('date', targetDate)
    .order('rank', { ascending: true })
    .limit(50);

  return (data ?? []).map((r) => ({
    rank: r.rank ?? 0,
    userId: r.user_id,
    nickname: (r.profiles as { nickname: string } | null)?.nickname ?? '알 수 없음',
    gritScore: r.grit_score ?? 0,
    practiceMinutes: Math.round((r.net_practice_time ?? 0) / 60),
    streak: 0,
  }));
}

// 7. CS - 피드백 요청
export async function getFeedbackRequests() {
  const { data } = await supabase
    .from('feedback_requests')
    .select('*, profiles:student_id(nickname)')
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

// 7. CS - 피드백
export async function getFeedbacks() {
  const { data } = await supabase
    .from('feedbacks')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

// 6. 저작권 - 녹음 & 영상
export async function getRecordings() {
  const { data } = await supabase
    .from('recordings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function getRoomVideos() {
  const { data } = await supabase
    .from('room_videos')
    .select('*')
    .order('uploaded_at', { ascending: false })
    .limit(50);
  return data ?? [];
}
