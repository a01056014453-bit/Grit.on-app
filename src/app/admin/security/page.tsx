'use client';

import { useEffect, useState } from 'react';
import { Shield, Users, Clock, Database } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { supabase } from '@/lib/supabase';

export default function SecurityPage() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    rlsPolicies: number;
    lastActivity: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: todayActivity } = await supabase
        .from('daily_rankings')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      setStats({
        totalUsers: totalUsers ?? 0,
        rlsPolicies: 12,
        lastActivity: todayActivity ? `오늘 ${todayActivity}명 활동` : '활동 없음',
      });
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">보안</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="전체 사용자"
          value={stats?.totalUsers ?? '-'}
          icon={Users}
        />
        <StatCard
          title="RLS 정책"
          value={stats?.rlsPolicies ?? '-'}
          icon={Shield}
          changeType="positive"
          change="활성"
        />
        <StatCard
          title="오늘 활동"
          value={stats?.lastActivity ?? '-'}
          icon={Clock}
        />
        <StatCard
          title="데이터베이스"
          value="Supabase"
          icon={Database}
          changeType="positive"
          change="정상 운영"
        />
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">보안 현황</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-green-800">Supabase RLS (Row Level Security) 활성화</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-green-800">API Rate Limiting 적용 (10req/min)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-green-800">Security Headers 설정 완료</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-green-800">환경변수 암호화 (Vercel)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-green-800">Sentry 에러 모니터링 연동</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-yellow-800">보안 로그 수집 — Supabase Dashboard에서 확인</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-yellow-800">백업 관리 — Supabase 자동 백업 (Pro Plan)</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">외부 보안 도구</h2>
        <p className="text-sm text-gray-500">
          상세 보안 로그와 백업은 아래 외부 대시보드에서 관리됩니다.
        </p>
        <div className="flex gap-3">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Supabase Dashboard
          </a>
          <a
            href="https://sentry.io"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
          >
            Sentry Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
