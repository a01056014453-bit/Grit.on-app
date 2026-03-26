'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Activity, Music } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';

interface UserRow {
  id: string;
  nickname: string;
  name: string | null;
  email: string | null;
  instrument: string;
  level: string | null;
  authProvider: string | null;
  gritScore: number | null;
  sessionCount: number;
  isWeeklyActive: boolean;
  hasPracticed: boolean;
  createdAt: string;
}

interface Stats {
  todaySignups: number;
  weeklyActive: number;
  practicedUsers: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>({ todaySignups: 0, weeklyActive: 0, practicedUsers: 0 });

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/users?limit=500&offset=0');
      if (!res.ok) return;
      const data = await res.json();
      setTotal(data.total ?? 0);
      setStats(data.stats ?? { todaySignups: 0, weeklyActive: 0, practicedUsers: 0 });

      const mapped: UserRow[] = (data.users ?? []).map((u: Record<string, unknown>) => ({
        id: u.id as string,
        nickname: u.nickname as string,
        name: u.name as string | null,
        email: u.email as string | null,
        instrument: u.instrument as string,
        level: u.level as string | null,
        authProvider: u.authProvider as string | null,
        gritScore: u.gritScore as number | null,
        sessionCount: u.sessionCount as number,
        isWeeklyActive: u.isWeeklyActive as boolean,
        hasPracticed: u.hasPracticed as boolean,
        createdAt: u.createdAt as string,
      }));
      setUsers(mapped);
    }
    load();
  }, []);

  const columns: Column<UserRow>[] = [
    {
      key: 'nickname',
      header: '닉네임',
      render: (row) => (
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
      render: (row) => (
        <StatusBadge
          label={row.authProvider === 'google' ? 'Google' : row.authProvider === 'apple' ? 'Apple' : row.authProvider ?? '-'}
          variant={row.authProvider === 'google' ? 'info' : 'neutral'}
        />
      ),
    },
    { key: 'level', header: '레벨', render: (row) => row.level ?? '-' },
    {
      key: 'sessionCount',
      header: '연습 횟수',
      render: (row) => <span className="font-number">{row.sessionCount}회</span>,
    },
    {
      key: 'gritScore',
      header: '그릿 점수',
      render: (row) => <span className="font-number">{row.gritScore?.toLocaleString() ?? '-'}</span>,
    },
    {
      key: 'createdAt',
      header: '가입일',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString('ko-KR') : '-',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">사용자 관리</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="전체 사용자" value={total} icon={Users} />
        <StatCard
          title="오늘 신규"
          value={stats.todaySignups}
          icon={UserPlus}
          change={stats.todaySignups > 0 ? `+${stats.todaySignups}명` : '없음'}
          changeType={stats.todaySignups > 0 ? 'positive' : 'neutral'}
        />
        <StatCard title="7일 활성" value={stats.weeklyActive} icon={Activity} />
        <StatCard
          title="연습한 사용자"
          value={stats.practicedUsers}
          icon={Music}
          change={total > 0 ? `${Math.round((stats.practicedUsers / total) * 100)}%` : ''}
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
