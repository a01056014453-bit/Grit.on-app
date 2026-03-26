'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Activity, Music } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { getUsers } from '@/lib/admin/queries';
import type { AdminUser } from '@/lib/admin/types';

interface UserWithExtra extends AdminUser {
  email?: string | null;
  authProvider?: string | null;
  sessionCount?: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithExtra[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/users?limit=500&offset=0');
      if (!res.ok) return;
      const data = await res.json();
      setTotal(data.total ?? 0);

      const mapped: UserWithExtra[] = (data.users ?? []).map((u: Record<string, unknown>) => ({
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
        subscription: 'free' as const,
        pushEnabled: false,
        email: u.email as string | null,
        authProvider: u.authProvider as string | null,
        sessionCount: u.sessionCount as number,
      }));
      setUsers(mapped);
    }
    load();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySignups = useMemo(
    () => users.filter((u) => u.createdAt?.startsWith(todayStr)).length,
    [users, todayStr],
  );

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const weeklyActive = useMemo(
    () => users.filter((u) => u.lastActiveAt && u.lastActiveAt >= weekAgo).length,
    [users, weekAgo],
  );

  const withPractice = useMemo(
    () => users.filter((u) => (u.sessionCount ?? 0) > 0).length,
    [users],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: Column<any>[] = [
    {
      key: 'nickname',
      header: '닉네임',
      render: (row: any) => (
        <div>
          <p className="font-medium text-gray-900">{row.nickname}</p>
          {row.email && <p className="text-xs text-gray-400">{row.email}</p>}
        </div>
      ),
    },
    { key: 'instrument', header: '악기' },
    {
      key: 'authProvider',
      header: '가입',
      render: (row: any) => (
        <StatusBadge
          label={row.authProvider === 'google' ? 'Google' : row.authProvider === 'apple' ? 'Apple' : row.authProvider ?? '-'}
          variant={row.authProvider === 'google' ? 'info' : row.authProvider === 'apple' ? 'neutral' : 'neutral'}
        />
      ),
    },
    { key: 'level', header: '레벨', render: (row: any) => row.level ?? '-' },
    {
      key: 'sessionCount',
      header: '연습 횟수',
      render: (row: any) => <span className="font-number">{row.sessionCount ?? 0}회</span>,
    },
    {
      key: 'gritScore',
      header: '그릿 점수',
      render: (row: any) => <span className="font-number">{row.gritScore?.toLocaleString() ?? '-'}</span>,
    },
    {
      key: 'createdAt',
      header: '가입일',
      render: (row: any) => row.createdAt ? new Date(row.createdAt).toLocaleDateString('ko-KR') : '-',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">사용자 관리</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="전체 사용자" value={total} icon={Users} />
        <StatCard
          title="오늘 신규"
          value={todaySignups}
          icon={UserPlus}
          change={todaySignups > 0 ? `+${todaySignups}명` : '없음'}
          changeType={todaySignups > 0 ? 'positive' : 'neutral'}
        />
        <StatCard title="7일 활성" value={weeklyActive} icon={Activity} />
        <StatCard
          title="연습한 사용자"
          value={withPractice}
          icon={Music}
          change={total > 0 ? `${Math.round((withPractice / total) * 100)}%` : ''}
          changeType="neutral"
        />
      </div>

      <DataTable
        columns={columns}
        data={users}
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
      />
    </div>
  );
}
