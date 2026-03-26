'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, Activity, Clock, TrendingUp, BarChart3,
  AlertCircle, ChevronRight, CheckCircle, GraduationCap,
  Music, Brain, Download, Smartphone,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard } from '@/components/admin/chart-card';
import { getDashboardStats, getWAUTrend, getAppStoreStats } from '@/lib/admin/queries';
import type { DashboardStats } from '@/lib/admin/types';

interface PreAnalyzeStatus {
  total: number;
  analyzed: number;
  remaining: number;
  progress: number;
  byCategory: Record<string, { total: number; done: number }>;
  byInstrument: Record<string, { total: number; done: number; label: string }>;
  totalDbAnalyses: number;
}

interface TodoItem {
  label: string;
  count: number;
  href: string;
  urgent: boolean;
}

interface RecentSignup {
  id: string;
  nickname: string;
  instrument: string;
  created_at: string;
}

interface AppStoreData {
  configured: boolean;
  message?: string;
  downloads: { totalDownloads: number; totalInstalls: number } | null;
  appInfo: Record<string, unknown> | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
  const [wauTrend, setWauTrend] = useState<{ week: string; users: number }[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [appStore, setAppStore] = useState<AppStoreData | null>(null);

  useEffect(() => {
    // 대시보드 통계 + 최근 가입자
    getDashboardStats().then((data) => {
      setStats(data);
      const signups = (data as any).recentSignups ?? [];
      setRecentSignups(signups);

      // 할일 목록
      const items: TodoItem[] = [];
      if (data.pendingVerifications > 0) {
        items.push({
          label: '선생님 인증 대기',
          count: data.pendingVerifications,
          href: '/admin/experts',
          urgent: true,
        });
      }
      setTodos(items);
    });

    // WAU 추이
    getWAUTrend().then(setWauTrend);

    // App Store 데이터
    getAppStoreStats().then(setAppStore);

  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">대시보드</h1>

      {/* 할일 위젯 */}
      {todos.length > 0 ? (
        <div className="bg-white rounded-xl border border-amber-200 p-4">
          <h2 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            오늘의 할일 ({todos.length}건)
          </h2>
          <div className="space-y-2">
            {todos.map((todo) => (
              <Link
                key={todo.label}
                href={todo.href}
                className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {todo.urgent && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                  <span className="text-sm font-medium text-gray-900">{todo.label}</span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-200 px-1.5 py-0.5 rounded-full">
                    {todo.count}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-green-200 p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-sm text-green-700 font-medium">처리할 항목이 없습니다</p>
        </div>
      )}

      {/* 핵심 지표 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="전체 사용자"
          value={stats?.totalUsers ?? '-'}
          icon={Users}
        />
        <StatCard
          title="오늘 활성 사용자 (DAU)"
          value={stats?.activeUsersToday ?? '-'}
          icon={Activity}
        />
        <StatCard
          title="주간 활성 사용자 (WAU)"
          value={stats?.weeklyActiveUsers ?? '-'}
          icon={TrendingUp}
        />
        <StatCard
          title="총 연습 세션"
          value={stats?.totalPracticeSessions ?? '-'}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="평균 연습 시간"
          value={stats ? `${stats.avgDailyPracticeMinutes}분` : '-'}
          icon={BarChart3}
        />
        <StatCard
          title="AI 분석 건수"
          value={stats?.totalSongAnalyses ?? '-'}
          icon={Brain}
        />
        <StatCard
          title="전문가 수"
          value={stats?.totalTeachers ?? '-'}
          icon={GraduationCap}
        />
        <StatCard
          title="검증 대기"
          value={stats?.pendingVerifications ?? '-'}
          change={stats && stats.pendingVerifications > 0 ? '처리 필요' : undefined}
          changeType={stats && stats.pendingVerifications > 0 ? 'negative' : undefined}
          icon={Music}
        />
      </div>

      {/* App Store 다운로드 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="App Store 다운로드"
          value={
            appStore === null
              ? '-'
              : !appStore.configured
                ? '설정 필요'
                : appStore.downloads?.totalDownloads?.toLocaleString() ?? '조회 불가'
          }
          change={appStore && !appStore.configured ? 'API 키 미설정' : undefined}
          changeType={appStore && !appStore.configured ? 'neutral' : undefined}
          icon={Download}
        />
        <StatCard
          title="App Store 설치"
          value={
            appStore === null
              ? '-'
              : !appStore.configured
                ? '설정 필요'
                : appStore.downloads?.totalInstalls?.toLocaleString() ?? '조회 불가'
          }
          icon={Smartphone}
        />
      </div>

      {/* WAU 차트 */}
      <ChartCard title="주간 활성 사용자 추이" description="최근 8주 (실제 데이터)">
        <div className="h-64">
          {wauTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wauTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#7c3aed" fill="#ede9fe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              데이터를 불러오는 중...
            </div>
          )}
        </div>
      </ChartCard>

      {/* 최근 가입자 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">최근 가입자 (10명)</h2>
        {recentSignups.length > 0 ? (
          <div className="space-y-2">
            {recentSignups.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-violet-600">
                      {(user.nickname ?? '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.nickname ?? '(이름없음)'}</p>
                    <p className="text-xs text-gray-400">{user.instrument ?? '-'}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">아직 가입자가 없습니다</p>
        )}
      </div>
    </div>
  );
}
