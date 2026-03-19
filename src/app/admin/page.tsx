'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, Music, Brain, GraduationCap, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard } from '@/components/admin/chart-card';
import { getDashboardStats, getWAUTrend } from '@/lib/admin/queries';
import type { DashboardStats } from '@/lib/admin/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [wauTrend, setWauTrend] = useState<{ week: string; users: number }[]>([]);

  useEffect(() => {
    getDashboardStats().then(setStats);
    getWAUTrend().then(setWauTrend);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">대시보드</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="전체 사용자"
          value={stats?.totalUsers ?? '-'}
          icon={Users}
        />
        <StatCard
          title="오늘 활성 사용자"
          value={stats?.activeUsersToday ?? '-'}
          icon={Activity}
        />
        <StatCard
          title="총 연습 세션"
          value={stats?.totalPracticeSessions ?? '-'}
          icon={Clock}
        />
        <StatCard
          title="AI 분석 건수"
          value={stats?.totalSongAnalyses ?? '-'}
          icon={Brain}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="주간 활성 사용자"
          value={stats?.weeklyActiveUsers ?? '-'}
          icon={TrendingUp}
        />
        <StatCard
          title="평균 연습 시간"
          value={stats ? `${stats.avgDailyPracticeMinutes}분` : '-'}
          icon={BarChart3}
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
    </div>
  );
}
