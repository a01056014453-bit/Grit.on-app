'use client';

import { useState } from 'react';
import { Megaphone, MousePointer, UserPlus, Share2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard } from '@/components/admin/chart-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge, getStatusVariant } from '@/components/admin/status-badge';
import { mockMarketingCampaigns, mockReferralCodes } from '@/lib/admin/mock-data';
import type { MarketingCampaign, ReferralCode } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export default function MarketingPage() {
  const [tab, setTab] = useState<'campaigns' | 'referrals'>('campaigns');

  const totalImpressions = mockMarketingCampaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = mockMarketingCampaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = mockMarketingCampaigns.reduce((s, c) => s + c.conversions, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0';

  const campaignColumns: Column<MarketingCampaign>[] = [
    { key: 'name', header: '캠페인명', render: (row) => <span className="font-medium">{row.name}</span> },
    {
      key: 'channel',
      header: '채널',
      render: (row) => {
        const labels: Record<string, string> = { utm: 'UTM', referral: '추천', push: '푸시', email: '이메일' };
        return <StatusBadge label={labels[row.channel]} variant="purple" />;
      },
    },
    {
      key: 'status',
      header: '상태',
      render: (row) => (
        <StatusBadge
          label={row.status === 'active' ? '진행중' : row.status === 'paused' ? '일시정지' : '완료'}
          variant={getStatusVariant(row.status)}
        />
      ),
    },
    { key: 'impressions', header: '노출', render: (row) => <span className="font-number">{row.impressions.toLocaleString()}</span> },
    { key: 'clicks', header: '클릭', render: (row) => <span className="font-number">{row.clicks.toLocaleString()}</span> },
    { key: 'conversions', header: '전환', render: (row) => <span className="font-number">{row.conversions.toLocaleString()}</span> },
    {
      key: 'ctr',
      header: 'CTR',
      render: (row) => (
        <span className="font-number text-violet-600">
          {row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(1) : '0'}%
        </span>
      ),
    },
  ];

  const referralColumns: Column<ReferralCode>[] = [
    { key: 'code', header: '코드', render: (row) => <span className="font-mono font-medium text-violet-600">{row.code}</span> },
    { key: 'ownerName', header: '소유자', render: (row) => row.ownerName },
    { key: 'usageCount', header: '사용', render: (row) => <span className="font-number">{row.usageCount}</span> },
    { key: 'conversionCount', header: '전환', render: (row) => <span className="font-number">{row.conversionCount}</span> },
    {
      key: 'conversionRate',
      header: '전환율',
      render: (row) => (
        <span className="font-number text-green-600">
          {row.usageCount > 0 ? ((row.conversionCount / row.usageCount) * 100).toFixed(0) : '0'}%
        </span>
      ),
    },
    {
      key: 'isActive',
      header: '상태',
      render: (row) => <StatusBadge label={row.isActive ? '활성' : '비활성'} variant={row.isActive ? 'success' : 'neutral'} />,
    },
  ];

  const chartData = mockMarketingCampaigns.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name,
    클릭: c.clicks,
    전환: c.conversions,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">마케팅</h1>

      <div className="flex gap-2">
        {(['campaigns', 'referrals'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100',
            )}
          >
            {t === 'campaigns' ? '캠페인' : '추천 코드'}
          </button>
        ))}
      </div>

      {tab === 'campaigns' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard title="총 노출" value={totalImpressions.toLocaleString()} icon={Megaphone} />
            <StatCard title="총 클릭" value={totalClicks.toLocaleString()} icon={MousePointer} />
            <StatCard title="총 전환" value={totalConversions.toLocaleString()} icon={UserPlus} changeType="positive" />
            <StatCard title="평균 CTR" value={`${avgCTR}%`} icon={MousePointer} />
          </div>

          <ChartCard title="캠페인별 클릭/전환">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Bar dataKey="클릭" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="전환" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <DataTable columns={campaignColumns} data={mockMarketingCampaigns} />
        </>
      )}

      {tab === 'referrals' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="활성 코드" value={mockReferralCodes.filter((r) => r.isActive).length} icon={Share2} />
            <StatCard title="총 사용" value={mockReferralCodes.reduce((s, r) => s + r.usageCount, 0)} icon={UserPlus} />
            <StatCard title="총 전환" value={mockReferralCodes.reduce((s, r) => s + r.conversionCount, 0)} icon={UserPlus} changeType="positive" />
          </div>
          <DataTable columns={referralColumns} data={mockReferralCodes} />
        </>
      )}
    </div>
  );
}
