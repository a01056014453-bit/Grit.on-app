'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { StatusBadge, getStatusVariant } from '@/components/admin/status-badge';
import { mockExpertVerifications } from '@/lib/admin/mock-data';
import type { ExpertVerification } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export default function ExpertsPage() {
  const [selected, setSelected] = useState<ExpertVerification | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? mockExpertVerifications
    : mockExpertVerifications.filter((v) => v.status === filter);

  const pending = mockExpertVerifications.filter((v) => v.status === 'pending').length;
  const reviewing = mockExpertVerifications.filter((v) => v.status === 'review').length;
  const approved = mockExpertVerifications.filter((v) => v.status === 'approved').length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">전문가 검증</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="대기 중" value={pending} icon={Clock} changeType="negative" change="처리 필요" />
        <StatCard title="검토 중" value={reviewing} icon={FileText} />
        <StatCard title="승인 완료" value={approved} icon={CheckCircle} />
        <StatCard title="전체" value={mockExpertVerifications.length} icon={FileText} />
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'review', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100',
            )}
          >
            {f === 'all' ? '전체' : f === 'pending' ? '대기' : f === 'review' ? '검토' : f === 'approved' ? '승인' : '거절'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 space-y-2">
          {filtered.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v)}
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-all',
                selected?.id === v.id ? 'border-violet-300 bg-violet-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300',
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">{v.teacherName}</span>
                <StatusBadge label={v.status} variant={getStatusVariant(v.status)} />
              </div>
              <p className="text-xs text-gray-500">{v.specialty.join(' · ')}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(v.submittedAt).toLocaleDateString('ko-KR')}</p>
            </button>
          ))}
        </div>

        <div className="col-span-3">
          {selected ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.teacherName}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selected.specialty.join(' · ')}</p>
                </div>
                <StatusBadge label={selected.status} variant={getStatusVariant(selected.status)} />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">제출일</p>
                  <p className="text-sm font-medium mt-1">{new Date(selected.submittedAt).toLocaleDateString('ko-KR')}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">평점</p>
                  <p className="text-sm font-medium mt-1">{selected.rating ?? '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">완료 건수</p>
                  <p className="text-sm font-medium font-number mt-1">{selected.completedCount}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">제출 서류</h3>
                <div className="space-y-3">
                  {selected.documents.map((doc, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{doc.type}</span>
                      </div>
                      {doc.ocrResult && (
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">OCR 결과</p>
                          <p className="text-sm text-gray-900">{doc.ocrResult}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selected.status === 'pending' || selected.status === 'review' ? (
                <div className="flex gap-3 pt-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                    승인
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    <XCircle className="w-4 h-4" />
                    거절
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">좌측에서 전문가를 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
