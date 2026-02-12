'use client';

import { useState } from 'react';
import { Headphones, AlertCircle, CheckCircle, HelpCircle, Eye } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge, getStatusVariant } from '@/components/admin/status-badge';
import { mockSupportTickets, mockFAQs } from '@/lib/admin/mock-data';
import type { SupportTicket, FAQ } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export default function SupportPage() {
  const [tab, setTab] = useState<'tickets' | 'faq'>('tickets');

  const open = mockSupportTickets.filter((t) => t.status === 'open').length;
  const inProgress = mockSupportTickets.filter((t) => t.status === 'in_progress').length;
  const urgent = mockSupportTickets.filter((t) => t.priority === 'urgent' || t.priority === 'high').length;

  const ticketColumns: Column<SupportTicket>[] = [
    {
      key: 'priority',
      header: '우선순위',
      render: (row) => (
        <StatusBadge
          label={row.priority === 'urgent' ? '긴급' : row.priority === 'high' ? '높음' : row.priority === 'medium' ? '보통' : '낮음'}
          variant={getStatusVariant(row.priority)}
        />
      ),
    },
    {
      key: 'subject',
      header: '제목',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.subject}</p>
          <p className="text-xs text-gray-400">{row.userName} · {row.category}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (row) => {
        const labels: Record<string, string> = { open: '접수', in_progress: '처리중', resolved: '해결', closed: '종료' };
        return <StatusBadge label={labels[row.status]} variant={getStatusVariant(row.status)} />;
      },
    },
    {
      key: 'createdAt',
      header: '접수일',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ko-KR'),
    },
    {
      key: 'updatedAt',
      header: '최종 업데이트',
      render: (row) => new Date(row.updatedAt).toLocaleDateString('ko-KR'),
    },
  ];

  const faqColumns: Column<FAQ>[] = [
    { key: 'category', header: '카테고리', render: (row) => <StatusBadge label={row.category} variant="purple" /> },
    { key: 'question', header: '질문', render: (row) => <span className="font-medium">{row.question}</span> },
    {
      key: 'views',
      header: '조회수',
      render: (row) => (
        <span className="font-number flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-gray-400" />
          {row.views.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'isPublished',
      header: '공개',
      render: (row) => <StatusBadge label={row.isPublished ? '공개' : '비공개'} variant={row.isPublished ? 'success' : 'neutral'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">CS 지원</h1>

      <div className="flex gap-2">
        {(['tickets', 'faq'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100',
            )}
          >
            {t === 'tickets' ? '지원 티켓' : 'FAQ 관리'}
          </button>
        ))}
      </div>

      {tab === 'tickets' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard title="미처리" value={open} icon={AlertCircle} changeType="negative" change="처리 필요" />
            <StatCard title="처리 중" value={inProgress} icon={Headphones} />
            <StatCard title="긴급/높음" value={urgent} icon={AlertCircle} changeType="negative" />
            <StatCard title="전체" value={mockSupportTickets.length} icon={HelpCircle} />
          </div>
          <DataTable columns={ticketColumns} data={mockSupportTickets} />
        </>
      )}

      {tab === 'faq' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="전체 FAQ" value={mockFAQs.length} icon={HelpCircle} />
            <StatCard title="공개" value={mockFAQs.filter((f) => f.isPublished).length} icon={CheckCircle} />
            <StatCard title="총 조회" value={mockFAQs.reduce((s, f) => s + f.views, 0).toLocaleString()} icon={Eye} />
          </div>
          <DataTable columns={faqColumns} data={mockFAQs} />
        </>
      )}
    </div>
  );
}
