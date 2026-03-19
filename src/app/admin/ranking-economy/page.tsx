'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { getRankings } from '@/lib/admin/queries';
import type { RankingEntry } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export default function RankingEconomyPage() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);

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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">랭킹</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="오늘 참여자" value={rankings.length} icon={Trophy} />
        <StatCard title="1위 점수" value={rankings[0]?.gritScore.toLocaleString() ?? '-'} icon={TrendingUp} />
        <StatCard title="평균 점수" value={rankings.length ? Math.round(rankings.reduce((s, r) => s + r.gritScore, 0) / rankings.length).toLocaleString() : '-'} icon={TrendingUp} />
      </div>

      <DataTable columns={rankingColumns} data={rankings} />

      {rankings.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          오늘의 랭킹 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
