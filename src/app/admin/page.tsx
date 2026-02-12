'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, Music, Brain, GraduationCap, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard } from '@/components/admin/chart-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { getDashboardStats } from '@/lib/admin/queries';
import { mockWAUTrend, mockAIModelStats } from '@/lib/admin/mock-data';
import type { DashboardStats, AIModelStats } from '@/lib/admin/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  const aiColumns: Column<AIModelStats>[] = [
    { key: 'model', header: '모델' },
    {
      key: 'requests',
      header: '요청 수',
      render: (row) => <span className="font-number">{row.requests.toLocaleString()}</span>,
    },
    {
      key: 'avgLatency',
      header: '평균 지연(초)',
      render: (row) => <span className="font-number">{row.avgLatency}s</span>,
    },
    {
      key: 'successRate',
      header: '성공률',
      render: (row) => <span className="font-number text-green-600">{row.successRate}%</span>,
    },
    {
      key: 'cost',
      header: '비용(USD)',
      render: (row) => <span className="font-number">${row.cost.toLocaleString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">대시보드</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="전체 사용자"
          value={stats?.totalUsers ?? '-'}
          change="+12% 전월 대비"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="오늘 활성 사용자"
          value={stats?.activeUsersToday ?? '-'}
          change="WAU 기준"
          changeType="neutral"
          icon={Activity}
        />
        <StatCard
          title="총 연습 세션"
          value={stats?.totalPracticeSessions ?? '-'}
          change="+8% 전주 대비"
          changeType="positive"
          icon={Clock}
        />
        <StatCard
          title="AI 분석 건수"
          value={stats?.totalSongAnalyses ?? '-'}
          change="+15% 전월 대비"
          changeType="positive"
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
          change="처리 필요"
          changeType="negative"
          icon={Music}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ChartCard title="주간 활성 사용자 추이" description="최근 8주">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockWAUTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#7c3aed" fill="#ede9fe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="AI 모델별 요청량" description="월간 누적">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAIModelStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="model" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="requests" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="AI 모델 상세 통계">
        <DataTable columns={aiColumns} data={mockAIModelStats} />
      </ChartCard>
    </div>
  );
}
