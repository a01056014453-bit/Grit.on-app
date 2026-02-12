'use client';

import { useEffect, useState } from 'react';
import { Music, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard } from '@/components/admin/chart-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge, getStatusVariant } from '@/components/admin/status-badge';
import { getMusicDB } from '@/lib/admin/queries';
import { mockUnregisteredSearches } from '@/lib/admin/mock-data';
import type { MusicDBItem, UnregisteredSearch } from '@/lib/admin/types';

const COLORS = ['#7c3aed', '#f59e0b', '#ef4444'];

export default function MusicDBPage() {
  const [pieces, setPieces] = useState<MusicDBItem[]>([]);

  useEffect(() => {
    getMusicDB().then(setPieces);
  }, []);

  const completed = pieces.filter((p) => p.analysisStatus === 'completed').length;
  const pending = pieces.filter((p) => p.analysisStatus === 'pending').length;
  const failed = pieces.filter((p) => p.analysisStatus === 'failed').length;

  const pieData = [
    { name: '완료', value: completed },
    { name: '대기', value: pending },
    { name: '실패', value: failed },
  ];

  const pieceColumns: Column<MusicDBItem>[] = [
    {
      key: 'title',
      header: '곡명',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-xs text-gray-400">{row.composer}</p>
        </div>
      ),
    },
    { key: 'key', header: '조성', render: (row) => row.key ?? '-' },
    { key: 'opus', header: 'Opus', render: (row) => row.opus ?? '-' },
    {
      key: 'analysisStatus',
      header: '분석 상태',
      render: (row) => (
        <StatusBadge
          label={row.analysisStatus === 'completed' ? '완료' : row.analysisStatus === 'pending' ? '대기' : '실패'}
          variant={getStatusVariant(row.analysisStatus)}
        />
      ),
    },
    {
      key: 'createdAt',
      header: '등록일',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ko-KR'),
    },
  ];

  const searchColumns: Column<UnregisteredSearch>[] = [
    { key: 'query', header: '검색어', render: (row) => <span className="font-medium">{row.query}</span> },
    { key: 'count', header: '검색 횟수', render: (row) => <span className="font-number">{row.count}</span> },
    {
      key: 'lastSearchedAt',
      header: '최근 검색',
      render: (row) => new Date(row.lastSearchedAt).toLocaleDateString('ko-KR'),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">곡 DB / AI</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="전체 곡" value={pieces.length} icon={Music} />
        <StatCard title="분석 완료" value={completed} icon={CheckCircle} changeType="positive" change={`${pieces.length ? Math.round((completed / pieces.length) * 100) : 0}%`} />
        <StatCard title="분석 대기" value={pending} icon={AlertCircle} changeType="negative" change="처리 필요" />
        <StatCard title="분석 실패" value={failed} icon={AlertCircle} changeType="negative" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ChartCard title="곡 목록">
            <DataTable columns={pieceColumns} data={pieces} />
          </ChartCard>
        </div>
        <ChartCard title="분석 상태 분포">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="미등록 곡 검색 로그" description="사용자가 찾지 못한 곡" action={<Search className="w-4 h-4 text-gray-400" />}>
        <DataTable columns={searchColumns} data={mockUnregisteredSearches} />
      </ChartCard>
    </div>
  );
}
