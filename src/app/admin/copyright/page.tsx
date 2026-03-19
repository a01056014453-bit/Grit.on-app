'use client';

import { useEffect, useState } from 'react';
import { Music, Video, Database } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { getContentStats } from '@/lib/admin/queries';
import { cn } from '@/lib/utils';

interface Recording {
  id: string;
  piece_title: string;
  user_id: string;
  created_at: string;
  duration: number;
  profiles: { nickname: string } | null;
}

interface RoomVideo {
  id: string;
  piece_title: string;
  piece_composer: string;
  user_id: string;
  uploaded_at: string | null;
  user_name: string | null;
}

export default function CopyrightPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [videos, setVideos] = useState<RoomVideo[]>([]);
  const [tab, setTab] = useState<'recordings' | 'videos'>('recordings');

  useEffect(() => {
    getContentStats().then(({ recordings, videos }) => {
      setRecordings(recordings as unknown as Recording[]);
      setVideos(videos as unknown as RoomVideo[]);
    });
  }, []);

  const recordingColumns: Column<Recording>[] = [
    {
      key: 'piece_title',
      header: '곡명',
      render: (row) => (
        <span className="font-medium">{row.piece_title}</span>
      ),
    },
    {
      key: 'profiles',
      header: '업로더',
      render: (row) => row.profiles?.nickname ?? '알 수 없음',
    },
    {
      key: 'duration',
      header: '길이',
      render: (row) => `${Math.floor(row.duration / 60)}:${String(row.duration % 60).padStart(2, '0')}`,
    },
    {
      key: 'created_at',
      header: '업로드일',
      render: (row) => new Date(row.created_at).toLocaleDateString('ko-KR'),
    },
  ];

  const videoColumns: Column<RoomVideo>[] = [
    {
      key: 'piece_title',
      header: '곡명',
      render: (row) => (
        <div>
          <p className="font-medium">{row.piece_title}</p>
          <p className="text-xs text-gray-400">{row.piece_composer}</p>
        </div>
      ),
    },
    {
      key: 'user_name',
      header: '업로더',
      render: (row) => row.user_name ?? '알 수 없음',
    },
    {
      key: 'uploaded_at',
      header: '업로드일',
      render: (row) => row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString('ko-KR') : '-',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">콘텐츠 관리</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="녹음 파일"
          value={recordings.length}
          icon={Music}
        />
        <StatCard
          title="합주실 영상"
          value={videos.length}
          icon={Video}
        />
        <StatCard
          title="전체 콘텐츠"
          value={recordings.length + videos.length}
          icon={Database}
        />
      </div>

      <div className="flex gap-2">
        {(['recordings', 'videos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100',
            )}
          >
            {t === 'recordings' ? '녹음' : '영상'}
          </button>
        ))}
      </div>

      {tab === 'recordings' && (
        <>
          <DataTable columns={recordingColumns} data={recordings} />
          {recordings.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              녹음 데이터가 없습니다.
            </div>
          )}
        </>
      )}

      {tab === 'videos' && (
        <>
          <DataTable columns={videoColumns} data={videos} />
          {videos.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              영상 데이터가 없습니다.
            </div>
          )}
        </>
      )}
    </div>
  );
}
