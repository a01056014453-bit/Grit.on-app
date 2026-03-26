'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Activity, Music } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { z } from 'zod';

/** API 응답 Zod 스키마 */
const userRowSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  instrument: z.string(),
  level: z.string().nullable(),
  authProvider: z.string().nullable(),
  gritScore: z.number(),
  sessionCount: z.number(),
  isWeeklyActive: z.boolean(),
  hasPracticed: z.boolean(),
  isToday: z.boolean(),
  createdAt: z.string(),
});

const statsSchema = z.object({
  todaySignups: z.number(),
  weeklyActive: z.number(),
  practicedUsers: z.number(),
});

const apiResponseSchema = z.object({
  users: z.array(userRowSchema),
  total: z.number(),
  stats: statsSchema,
});

type UserRow = z.infer<typeof userRowSchema>;
type Stats = z.infer<typeof statsSchema>;

const EMPTY_STATS: Stats = { todaySignups: 0, weeklyActive: 0, practicedUsers: 0 };

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/users?limit=500&offset=0');
        if (!res.ok) {
          setError('사용자 목록을 불러올 수 없습니다');
          return;
        }
        const raw = await res.json();
        const parsed = apiResponseSchema.safeParse(raw);

        if (!parsed.success) {
          console.error('[admin/users] 응답 검증 실패:', parsed.error.message);
          setError('데이터 형식 오류가 발생했습니다');
          return;
        }

        setUsers(parsed.data.users);
        setTotal(parsed.data.total);
        setStats(parsed.data.stats);
      } catch (err) {
        console.error('[admin/users] 로드 실패:', err);
        setError('네트워크 오류가 발생했습니다');
      }
    }
    load();
  }, []);

  const columns: Column<UserRow>[] = [
    {
      key: 'nickname',
      header: '닉네임',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{row.nickname}</p>
            {row.isToday && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">
                NEW
              </span>
            )}
          </div>
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
      render: (row) => <span className="font-number">{row.gritScore > 0 ? row.gritScore.toLocaleString() : '-'}</span>,
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

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
