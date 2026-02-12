'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge, getStatusVariant } from '@/components/admin/status-badge';
import { mockCopyrightItems } from '@/lib/admin/mock-data';
import type { CopyrightItem } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export default function CopyrightPage() {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? mockCopyrightItems
    : mockCopyrightItems.filter((c) => c.flagStatus === filter);

  const flagged = mockCopyrightItems.filter((c) => c.flagStatus === 'flagged').length;
  const reviewing = mockCopyrightItems.filter((c) => c.flagStatus === 'reviewing').length;
  const removed = mockCopyrightItems.filter((c) => c.flagStatus === 'removed').length;
  const clean = mockCopyrightItems.filter((c) => c.flagStatus === 'clean').length;

  const columns: Column<CopyrightItem>[] = [
    {
      key: 'contentType',
      header: '유형',
      render: (row) => (
        <StatusBadge
          label={row.contentType === 'recording' ? '녹음' : '영상'}
          variant={row.contentType === 'recording' ? 'info' : 'purple'}
        />
      ),
    },
    {
      key: 'title',
      header: '콘텐츠',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-xs text-gray-400">{row.uploaderName}</p>
        </div>
      ),
    },
    {
      key: 'flagStatus',
      header: '상태',
      render: (row) => {
        const labels: Record<string, string> = { clean: '정상', flagged: '의심', reviewing: '검토중', removed: '삭제됨' };
        return <StatusBadge label={labels[row.flagStatus]} variant={getStatusVariant(row.flagStatus)} />;
      },
    },
    {
      key: 'matchRate',
      header: '매칭률',
      render: (row) => row.matchRate !== null
        ? <span className={cn('font-number font-medium', row.matchRate >= 90 ? 'text-red-600' : row.matchRate >= 70 ? 'text-yellow-600' : 'text-green-600')}>{row.matchRate}%</span>
        : <span className="text-gray-400">-</span>,
    },
    {
      key: 'matchedWork',
      header: '매칭 원본',
      render: (row) => row.matchedWork ?? <span className="text-gray-400">-</span>,
    },
    {
      key: 'uploadedAt',
      header: '업로드일',
      render: (row) => new Date(row.uploadedAt).toLocaleDateString('ko-KR'),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">저작권</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="의심 콘텐츠" value={flagged} icon={AlertTriangle} changeType="negative" change="확인 필요" />
        <StatCard title="검토 중" value={reviewing} icon={Shield} />
        <StatCard title="삭제됨" value={removed} icon={XCircle} />
        <StatCard title="정상" value={clean} icon={CheckCircle} changeType="positive" />
      </div>

      <div className="flex gap-2">
        {['all', 'flagged', 'reviewing', 'clean', 'removed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100',
            )}
          >
            {f === 'all' ? '전체' : f === 'flagged' ? '의심' : f === 'reviewing' ? '검토중' : f === 'clean' ? '정상' : '삭제됨'}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
