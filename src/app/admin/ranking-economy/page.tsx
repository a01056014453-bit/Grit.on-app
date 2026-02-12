'use client';

import { useEffect, useState } from 'react';
import { Trophy, DollarSign, Tag, TrendingUp } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard } from '@/components/admin/chart-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge, getStatusVariant } from '@/components/admin/status-badge';
import { getRankings } from '@/lib/admin/queries';
import { mockRevenueData, mockPromotions } from '@/lib/admin/mock-data';
import type { RankingEntry, Promotion } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export default function RankingEconomyPage() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [tab, setTab] = useState<'ranking' | 'revenue' | 'promotions'>('ranking');

  useEffect(() => {
    getRankings().then(setRankings);
  }, []);

  const rankingColumns: Column<RankingEntry>[] = [
    {
      key: 'rank',
      header: '순위',
      render: (row) => (
        <span className={cn('font-number font-bold', row.rank <= 3 ? 'text-violet-600' : 'text-gray-900')}>
          #{row.rank}
        </span>
      ),
    },
    { key: 'nickname', header: '닉네임', render: (row) => <span className="font-medium">{row.nickname}</span> },
    { key: 'gritScore', header: '그릿 점수', render: (row) => <span className="font-number">{row.gritScore.toLocaleString()}</span> },
    { key: 'practiceMinutes', header: '연습(분)', render: (row) => <span className="font-number">{row.practiceMinutes}</span> },
  ];

  const promoColumns: Column<Promotion>[] = [
    { key: 'name', header: '프로모션명', render: (row) => <span className="font-medium">{row.name}</span> },
    {
      key: 'type',
      header: '유형',
      render: (row) => (
        <StatusBadge
          label={row.type === 'discount' ? '할인' : row.type === 'trial' ? '체험' : '크레딧'}
          variant={row.type === 'discount' ? 'purple' : row.type === 'trial' ? 'info' : 'success'}
        />
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (row) => <StatusBadge label={row.status === 'active' ? '진행중' : row.status === 'scheduled' ? '예정' : '종료'} variant={getStatusVariant(row.status)} />,
    },
    { key: 'usageCount', header: '사용 수', render: (row) => <span className="font-number">{row.usageCount.toLocaleString()}</span> },
    { key: 'startDate', header: '기간', render: (row) => `${row.startDate} ~ ${row.endDate}` },
  ];

  const totalRevenue = mockRevenueData.reduce((sum, r) => sum + r.revenue, 0);
  const latestRevenue = mockRevenueData[mockRevenueData.length - 1];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">랭킹 / 경제</h1>

      <div className="flex gap-2">
        {(['ranking', 'revenue', 'promotions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100',
            )}
          >
            {t === 'ranking' ? '랭킹' : t === 'revenue' ? '수익' : '프로모션'}
          </button>
        ))}
      </div>

      {tab === 'ranking' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="오늘 참여자" value={rankings.length} icon={Trophy} />
            <StatCard title="1위 점수" value={rankings[0]?.gritScore.toLocaleString() ?? '-'} icon={TrendingUp} />
            <StatCard title="평균 점수" value={rankings.length ? Math.round(rankings.reduce((s, r) => s + r.gritScore, 0) / rankings.length).toLocaleString() : '-'} icon={TrendingUp} />
          </div>
          <DataTable columns={rankingColumns} data={rankings} />
        </>
      )}

      {tab === 'revenue' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="누적 수익" value={`${(totalRevenue / 10000).toLocaleString()}만원`} icon={DollarSign} changeType="positive" change="+18% 전기 대비" />
            <StatCard title="이달 수익" value={`${(latestRevenue.revenue / 10000).toLocaleString()}만원`} icon={DollarSign} />
            <StatCard title="이달 구독자" value={latestRevenue.subscriptions} icon={Trophy} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <ChartCard title="월별 수익 추이">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${v / 10000}만`} />
                    <Tooltip formatter={(v) => `${Number(v).toLocaleString()}원`} />
                    <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fill="#ede9fe" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="월별 구독자 수">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="subscriptions" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </>
      )}

      {tab === 'promotions' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="활성 프로모션" value={mockPromotions.filter((p) => p.status === 'active').length} icon={Tag} />
            <StatCard title="총 사용 수" value={mockPromotions.reduce((s, p) => s + p.usageCount, 0)} icon={TrendingUp} />
            <StatCard title="예정" value={mockPromotions.filter((p) => p.status === 'scheduled').length} icon={Tag} />
          </div>
          <DataTable columns={promoColumns} data={mockPromotions} />
        </>
      )}
    </div>
  );
}
