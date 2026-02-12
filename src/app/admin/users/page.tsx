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

  const columns: Column<AdminUser>[] = [
    {
      key: 'nickname',
      header: '닉네임',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.nickname}</p>
          {row.name && <p className="text-xs text-gray-400">{row.name}</p>}
        </div>
      ),
    },
    { key: 'instrument', header: '악기' },
    { key: 'level', header: '레벨', render: (row) => row.level ?? '-' },
    {
      key: 'gritScore',
      header: '그릿 점수',
      render: (row) => <span className="font-number">{row.gritScore?.toLocaleString() ?? '-'}</span>,
    },
    {
      key: 'totalPracticeHours',
      header: '총 연습(시간)',
      render: (row) => <span className="font-number">{row.totalPracticeHours?.toFixed(1) ?? '-'}</span>,
    },
    {
      key: 'streakDays',
      header: '연속일',
      render: (row) => <span className="font-number">{row.streakDays ?? 0}일</span>,
    },
    {
      key: 'subscription',
      header: '구독',
      render: (row) => (
        <StatusBadge
          label={row.subscription === 'free' ? '무료' : row.subscription === 'premium' ? '프리미엄' : '프로'}
          variant={row.subscription === 'free' ? 'neutral' : row.subscription === 'premium' ? 'info' : 'purple'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: '가입일',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ko-KR'),
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
