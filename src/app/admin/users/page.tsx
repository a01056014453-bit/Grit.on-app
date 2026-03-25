'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Crown, Activity } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { getUsers } from '@/lib/admin/queries';
import type { AdminUser } from '@/lib/admin/types';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

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

  const premiumCount = users.filter((u) => u.subscription !== 'free').length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">사용자 관리</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="전체 사용자" value={users.length} icon={Users} />
        <StatCard title="오늘 신규" value={0} icon={UserPlus} change="집계 중" changeType="neutral" />
        <StatCard title="프리미엄+" value={premiumCount} icon={Crown} />
        <StatCard title="7일 활성" value={users.filter((u) => u.streakDays && u.streakDays > 0).length} icon={Activity} />
      </div>

      <DataTable
        columns={columns}
        data={users}
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
      />
    </div>
  );
}
