'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Activity, Music, Brain, GraduationCap, Clock, TrendingUp, BarChart3, AlertCircle, ChevronRight, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard } from '@/components/admin/chart-card';
import { getDashboardStats, getWAUTrend } from '@/lib/admin/queries';
import { supabase } from '@/lib/supabase';
import type { DashboardStats } from '@/lib/admin/types';

interface TodoItem {
  label: string;
  count: number;
  href: string;
  urgent: boolean;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [wauTrend, setWauTrend] = useState<{ week: string; users: number }[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    getDashboardStats().then(setStats);
    getWAUTrend().then(setWauTrend);

    // 할일 목록 로드
    async function loadTodos() {
      const items: TodoItem[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: pendingTeachers } = await (supabase as any)
        .from("teachers")
        .select("id", { count: "exact", head: true })
        .eq("verified", false);
      if ((pendingTeachers ?? 0) > 0) {
        items.push({ label: "선생님 인증 대기", count: pendingTeachers ?? 0, href: "/admin/experts", urgent: true });
      }

      const { count: pendingFeedback } = await supabase
        .from("feedback_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "SENT");
      if ((pendingFeedback ?? 0) > 0) {
        items.push({ label: "피드백 요청 대기", count: pendingFeedback ?? 0, href: "/admin/support", urgent: false });
      }

      setTodos(items);
    }
    loadTodos();
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
