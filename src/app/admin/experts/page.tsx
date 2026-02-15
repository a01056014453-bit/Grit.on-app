'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, FileText, Inbox, Sparkles } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { StatusBadge, getStatusVariant } from '@/components/admin/status-badge';
import { cn } from '@/lib/utils';
import {
  approveVerificationById,
  rejectVerificationById,
  getAllVerificationsFromSupabase,
} from '@/lib/teacher-store';
import type { TeacherVerification, AIVerdict } from '@/types';

export default function ExpertsPage() {
  const [verifications, setVerifications] = useState<TeacherVerification[]>([]);
  const [selected, setSelected] = useState<TeacherVerification | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const load = useCallback(async () => {
    const list = await getAllVerificationsFromSupabase();
    setVerifications(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter === 'all'
    ? verifications
    : verifications.filter((v) => v.status === filter);

  const pending = verifications.filter((v) => v.status === 'pending').length;
  const approved = verifications.filter((v) => v.status === 'approved').length;
  const rejected = verifications.filter((v) => v.status === 'rejected').length;

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      default: return status;
    }
  };

  const handleApprove = (v: TeacherVerification) => {
    approveVerificationById(v.id);
    load();
    setSelected(null);
  };

  const handleReject = (v: TeacherVerification) => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    rejectVerificationById(v.id, rejectReason || '서류 미비');
    load();
    setSelected(null);
    setShowRejectInput(false);
    setRejectReason('');
  };

  const verdictLabel = (verdict: AIVerdict) => {
    switch (verdict) {
      case 'likely_valid': return '유효 판정';
      case 'needs_attention': return '확인 필요';
      case 'suspicious': return '의심';
    }
  };

  const docTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      enrollment: '재학증명서',
      graduation: '졸업증명서',
      certificate: '자격증',
      other: '기타',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">전문가 검증</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="대기 중" value={pending} icon={Clock} changeType={pending > 0 ? "negative" : "neutral"} change={pending > 0 ? "처리 필요" : ""} />
        <StatCard title="승인 완료" value={approved} icon={CheckCircle} />
        <StatCard title="거절" value={rejected} icon={XCircle} />
        <StatCard title="전체" value={verifications.length} icon={FileText} />
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100',
            )}
          >
            {f === 'all' ? '전체' : f === 'pending' ? '대기' : f === 'approved' ? '승인' : '거절'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-400">
                {filter === 'all'
                  ? '아직 신청이 없습니다'
                  : '해당 상태의 신청이 없습니다'}
              </p>
              {filter === 'all' && (
                <p className="text-xs text-gray-400 mt-1">
                  앱 프로필 → 선생님 등록에서 신청하면 여기에 표시됩니다
                </p>
              )}
            </div>
          ) : (
            filtered.map((v) => (
              <button
                key={v.id}
                onClick={() => { setSelected(v); setShowRejectInput(false); }}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all',
                  selected?.id === v.id ? 'border-violet-300 bg-violet-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{v.applicantName}</span>
                  <StatusBadge label={statusLabel(v.status)} variant={getStatusVariant(statusLabel(v.status))} />
                </div>
                <p className="text-xs text-gray-500">{v.specialty.join(' · ')}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {v.appliedAt ? new Date(v.appliedAt).toLocaleDateString('ko-KR') : '-'}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="col-span-3">
          {selected ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.applicantName}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selected.specialty.join(' · ')}</p>
                </div>
                <StatusBadge label={statusLabel(selected.status)} variant={getStatusVariant(statusLabel(selected.status))} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">신청일</p>
                  <p className="text-sm font-medium mt-1">
                    {selected.appliedAt ? new Date(selected.appliedAt).toLocaleDateString('ko-KR') : '-'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">서류 수</p>
                  <p className="text-sm font-medium mt-1">{selected.documents.length}건</p>
                </div>
              </div>

              {selected.reviewedAt && (
                <div className={cn(
                  'p-3 rounded-lg text-sm',
                  selected.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                )}>
                  <p className="font-medium">
                    {selected.status === 'approved' ? '승인 완료' : '거절됨'}
                    {' · '}
                    {new Date(selected.reviewedAt).toLocaleDateString('ko-KR')}
                  </p>
                  {selected.rejectReason && (
                    <p className="text-xs mt-1">사유: {selected.rejectReason}</p>
                  )}
                </div>
              )}

              {/* AI 전체 판정 패널 */}
              {selected.aiReview ? (
                <div className={cn(
                  'p-4 rounded-lg border',
                  selected.aiReview.verdict === 'likely_valid' && 'bg-green-50 border-green-200',
                  selected.aiReview.verdict === 'needs_attention' && 'bg-amber-50 border-amber-200',
                  selected.aiReview.verdict === 'suspicious' && 'bg-red-50 border-red-200',
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className={cn(
                      'w-4 h-4',
                      selected.aiReview.verdict === 'likely_valid' && 'text-green-600',
                      selected.aiReview.verdict === 'needs_attention' && 'text-amber-600',
                      selected.aiReview.verdict === 'suspicious' && 'text-red-600',
                    )} />
                    <span className={cn(
                      'text-sm font-semibold',
                      selected.aiReview.verdict === 'likely_valid' && 'text-green-700',
                      selected.aiReview.verdict === 'needs_attention' && 'text-amber-700',
                      selected.aiReview.verdict === 'suspicious' && 'text-red-700',
                    )}>
                      AI 사전 심사: {verdictLabel(selected.aiReview.verdict)}
                    </span>
                  </div>
                  <p className={cn(
                    'text-xs',
                    selected.aiReview.verdict === 'likely_valid' && 'text-green-600',
                    selected.aiReview.verdict === 'needs_attention' && 'text-amber-600',
                    selected.aiReview.verdict === 'suspicious' && 'text-red-600',
                  )}>
                    {selected.aiReview.summary}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">AI 사전 심사 결과 없음</span>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">제출 서류</h3>
                <div className="space-y-4">
                  {selected.documents.map((doc, i) => {
                    const aiDoc = selected.aiReview?.documents.find((d) => d.documentId === doc.id);
                    const isImage = doc.fileData?.startsWith('data:image');

                    return (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{docTypeLabel(doc.type)}</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(doc.uploadedAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>

                        {/* 이미지 미리보기 */}
                        {isImage && (
                          <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 bg-white">
                            <img
                              src={doc.fileData}
                              alt={doc.fileName}
                              className="w-full max-h-64 object-contain"
                            />
                          </div>
                        )}

                        <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                          <p className="text-xs text-gray-500">파일명</p>
                          <p className="text-sm text-gray-900">{doc.fileName}</p>
                        </div>

                        {/* AI 문서별 분석 결과 */}
                        {aiDoc && (
                          <div className={cn(
                            'p-3 rounded border text-xs space-y-1.5',
                            aiDoc.isValid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200',
                          )}>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                              <span className="font-medium text-gray-700">AI 분석 결과</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-gray-600">
                              <div>
                                <span className="text-gray-400">유효성: </span>
                                <span className={aiDoc.isValid ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                                  {aiDoc.isValid ? '유효' : '확인 필요'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">신뢰도: </span>
                                <span className="font-medium">{Math.round(aiDoc.confidence * 100)}%</span>
                              </div>
                              {aiDoc.institution && (
                                <div>
                                  <span className="text-gray-400">기관: </span>
                                  <span>{aiDoc.institution}</span>
                                </div>
                              )}
                              {aiDoc.major && (
                                <div>
                                  <span className="text-gray-400">전공: </span>
                                  <span>{aiDoc.major}</span>
                                </div>
                              )}
                            </div>
                            {aiDoc.warnings.length > 0 && (
                              <div className="pt-1 border-t border-amber-200">
                                {aiDoc.warnings.map((w, wi) => (
                                  <p key={wi} className="text-amber-700">⚠ {w}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selected.status === 'pending' && (
                <div className="space-y-3 pt-2">
                  {showRejectInput && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">거절 사유</label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="거절 사유를 입력하세요"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selected)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(selected)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      {showRejectInput ? '거절 확인' : '거절'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">좌측에서 신청을 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
