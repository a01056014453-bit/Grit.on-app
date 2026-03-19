'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, Calendar, UserPlus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard } from '@/components/admin/chart-card';
import { supabase } from '@/lib/supabase';

interface SignupTrend {
  date: string;
  count: number;
}

export default function MarketingPage() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [thisWeekSignups, setThisWeekSignups] = useState<number>(0);
  const [thisMonthSignups, setThisMonthSignups] = useState<number>(0);
  const [signupTrend, setSignupTrend] = useState<SignupTrend[]>([]);

  useEffect(() => {
    async function load() {
      // 전체 사용자 수
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      setTotalUsers(count ?? 0);

      // 이번 주 가입
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: weekCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);
      setThisWeekSignups(weekCount ?? 0);

      // 이번 달 가입
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count: monthCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());
      setThisMonthSignups(monthCount ?? 0);

      // 최근 30일 가입 추이
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      const byDate: Record<string, number> = {};
      (recentUsers ?? []).forEach((u) => {
        if (!u.created_at) return;
        const date = new Date(u.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        byDate[date] = (byDate[date] ?? 0) + 1;
      });

      setSignupTrend(
        Object.entries(byDate).map(([date, count]) => ({ date, count }))
      );
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">사용자 성장</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="전체 사용자"
          value={totalUsers}
          icon={Users}
        />
        <StatCard
          title="이번 주 가입"
          value={thisWeekSignups}
          icon={UserPlus}
          changeType={thisWeekSignups > 0 ? 'positive' : undefined}
        />
        <StatCard
          title="이번 달 가입"
          value={thisMonthSignups}
          icon={Calendar}
        />
        <StatCard
          title="일 평균 가입"
          value={signupTrend.length > 0
            ? Math.round(signupTrend.reduce((s, d) => s + d.count, 0) / signupTrend.length)
            : '-'}
          icon={TrendingUp}
        />
      </div>

      <ChartCard title="최근 30일 가입 추이" description="실제 데이터">
        <div className="h-64">
          {signupTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#7c3aed" fill="#ede9fe" strokeWidth={2} name="가입자" />
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
