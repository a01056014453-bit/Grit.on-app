'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, Database, Lock } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge, getStatusVariant } from '@/components/admin/status-badge';
import { mockSecurityLogs, mockBackupRecords } from '@/lib/admin/mock-data';
import type { SecurityLog, BackupRecord } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export default function SecurityPage() {
  const [tab, setTab] = useState<'logs' | 'backup'>('logs');

  const critical = mockSecurityLogs.filter((l) => l.severity === 'critical').length;
  const warnings = mockSecurityLogs.filter((l) => l.severity === 'warning').length;

  const logColumns: Column<SecurityLog>[] = [
    {
      key: 'severity',
      header: '심각도',
      render: (row) => (
        <StatusBadge
          label={row.severity === 'critical' ? '심각' : row.severity === 'warning' ? '경고' : '정보'}
          variant={getStatusVariant(row.severity)}
        />
      ),
    },
    { key: 'event', header: '이벤트', render: (row) => <span className="font-medium">{row.event}</span> },
    { key: 'ip', header: 'IP', render: (row) => <span className="font-mono text-xs">{row.ip}</span> },
    { key: 'details', header: '상세', render: (row) => <span className="text-gray-600">{row.details}</span> },
    {
      key: 'timestamp',
      header: '시각',
      render: (row) => new Date(row.timestamp).toLocaleString('ko-KR'),
    },
  ];

  const backupColumns: Column<BackupRecord>[] = [
    {
      key: 'type',
      header: '유형',
      render: (row) => (
        <StatusBadge
          label={row.type === 'full' ? '전체' : '증분'}
          variant={row.type === 'full' ? 'purple' : 'info'}
        />
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (row) => (
        <StatusBadge
          label={row.status === 'completed' ? '완료' : row.status === 'in_progress' ? '진행중' : '실패'}
          variant={getStatusVariant(row.status)}
        />
      ),
    },
    { key: 'size', header: '크기', render: (row) => <span className="font-number">{row.size}</span> },
    { key: 'duration', header: '소요시간', render: (row) => row.duration },
    {
      key: 'createdAt',
      header: '생성일',
      render: (row) => new Date(row.createdAt).toLocaleString('ko-KR'),
    },
  ];

  const lastBackup = mockBackupRecords[0];
  const failedBackups = mockBackupRecords.filter((b) => b.status === 'failed').length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">보안</h1>

      <div className="flex gap-2">
        {(['logs', 'backup'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100',
            )}
          >
            {t === 'logs' ? '보안 로그' : '백업 관리'}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard title="심각 이벤트" value={critical} icon={AlertTriangle} changeType="negative" change="즉시 조치" />
            <StatCard title="경고" value={warnings} icon={Shield} changeType="negative" />
            <StatCard title="전체 로그" value={mockSecurityLogs.length} icon={Lock} />
            <StatCard title="마지막 점검" value="오늘" icon={Shield} changeType="positive" change="정상" />
          </div>
          <DataTable columns={logColumns} data={mockSecurityLogs} />
        </>
      )}

      {tab === 'backup' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard title="마지막 백업" value={lastBackup.size} icon={Database} changeType="positive" change={new Date(lastBackup.createdAt).toLocaleDateString('ko-KR')} />
            <StatCard title="전체 백업" value={mockBackupRecords.length} icon={Database} />
            <StatCard title="실패" value={failedBackups} icon={AlertTriangle} changeType={failedBackups > 0 ? 'negative' : 'positive'} />
            <StatCard title="다음 백업" value="04:00" icon={Lock} change="증분 백업 예정" changeType="neutral" />
          </div>
          <DataTable columns={backupColumns} data={mockBackupRecords} />
        </>
      )}
    </div>
  );
}
