'use client';

import { useEffect, useState } from 'react';
import { Headphones, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { getSupportStats } from '@/lib/admin/queries';

interface FeedbackRequest {
  id: string;
  status: string;
  created_at: string;
  student_id: string;
  profiles: { nickname: string } | null;
}

export default function SupportPage() {
  const [requests, setRequests] = useState<FeedbackRequest[]>([]);

  useEffect(() => {
    getSupportStats().then((data) => setRequests(data as unknown as FeedbackRequest[]));
  }, []);

  const pending = requests.filter((r) => r.status === 'pending').length;
  const accepted = requests.filter((r) => r.status === 'accepted').length;
  const completed = requests.filter((r) => r.status === 'completed').length;

  const columns: Column<FeedbackRequest>[] = [
    {
      key: 'profiles',
      header: '요청자',
      render: (row) => (
        <span className="font-medium">
          {row.profiles?.nickname ?? '알 수 없음'}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (row) => {
        const labels: Record<string, string> = {
          pending: '대기중',
          accepted: '수락됨',
          completed: '완료',
          cancelled: '취소',
        };
        const variants: Record<string, 'warning' | 'info' | 'success' | 'neutral'> = {
          pending: 'warning',
          accepted: 'info',
          completed: 'success',
          cancelled: 'neutral',
        };
        return (
          <StatusBadge
            label={labels[row.status] ?? row.status}
            variant={variants[row.status] ?? 'neutral'}
          />
        );
      },
    },
    {
      key: 'created_at',
      header: '요청일',
      render: (row) => new Date(row.created_at).toLocaleDateString('ko-KR'),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">CS 지원</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="전체 요청"
          value={requests.length}
          icon={Headphones}
        />
        <StatCard
          title="대기중"
          value={pending}
          icon={AlertCircle}
          changeType={pending > 0 ? 'negative' : 'positive'}
          change={pending > 0 ? '처리 필요' : undefined}
        />
        <StatCard
          title="수락됨"
          value={accepted}
          icon={Clock}
        />
        <StatCard
          title="완료"
          value={completed}
          icon={CheckCircle}
          changeType="positive"
        />
      </div>

      <DataTable columns={columns} data={requests} />

      {requests.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          피드백 요청 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
