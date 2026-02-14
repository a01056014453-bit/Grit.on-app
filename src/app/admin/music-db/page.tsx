'use client';

import { useEffect, useState, useCallback } from 'react';
import { Music, CheckCircle, AlertTriangle, Plus, RefreshCw, Trash2, Loader2, X } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard } from '@/components/admin/chart-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import type { SongAnalysis } from '@/types/song-analysis';
import { getDifficultyLabel, getVerificationLabel } from '@/types/song-analysis';

type AnalysisListItem = SongAnalysis & { _composer: string; _title: string };

export default function MusicDBPage() {
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 새 곡 분석 폼
  const [newComposer, setNewComposer] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState('');

  // 재분석 중인 항목
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<AnalysisListItem | null>(null);

  // 상세 보기
  const [detailTarget, setDetailTarget] = useState<AnalysisListItem | null>(null);

  const fetchAnalyses = useCallback(async () => {
    try {
      const res = await fetch('/api/analyze-song-v2');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAnalyses(
          json.data.map((a: SongAnalysis) => ({
            ...a,
            _composer: a.meta.composer,
            _title: a.meta.title,
          }))
        );
      }
    } catch {
      console.error('분석 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const verified = analyses.filter((a) => a.verification_status === 'Verified').length;
  const needsReview = analyses.filter((a) => a.verification_status === 'Needs Review').length;

  // 새 곡 분석
  const handleAnalyze = async () => {
    if (!newComposer.trim() || !newTitle.trim()) return;
    setAnalyzing(true);
    setAnalyzeStatus('AI 분석 중... (1-2분 소요)');
    try {
      const res = await fetch('/api/analyze-song-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          composer: newComposer.trim(),
          title: newTitle.trim(),
          forceRefresh: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAnalyzeStatus('분석 완료!');
        setNewComposer('');
        setNewTitle('');
        await fetchAnalyses();
      } else {
        setAnalyzeStatus(`분석 실패: ${json.error}`);
      }
    } catch {
      setAnalyzeStatus('네트워크 오류');
    } finally {
      setAnalyzing(false);
      setTimeout(() => setAnalyzeStatus(''), 5000);
    }
  };

  // 재분석
  const handleReanalyze = async (item: AnalysisListItem) => {
    if (!confirm(`"${item._composer} - ${item._title}" 곡을 재분석하시겠습니까?\nAI API를 다시 호출합니다.`)) return;
    setReanalyzingId(item.id);
    try {
      const res = await fetch('/api/analyze-song-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          composer: item._composer,
          title: item._title,
          forceRefresh: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchAnalyses();
      } else {
        alert(`재분석 실패: ${json.error}`);
      }
    } catch {
      alert('네트워크 오류');
    } finally {
      setReanalyzingId(null);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/analyze-song-v2', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          composer: deleteTarget._composer,
          title: deleteTarget._title,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchAnalyses();
      } else {
        alert(`삭제 실패: ${json.error}`);
      }
    } catch {
      alert('네트워크 오류');
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns: Column<AnalysisListItem>[] = [
    {
      key: 'composer',
      header: '작곡가',
      render: (row) => <span className="font-medium text-gray-900">{row._composer}</span>,
    },
    {
      key: 'title',
      header: '곡명',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row._title}</p>
          {row.meta.opus && <p className="text-xs text-gray-400">{row.meta.opus}</p>}
        </div>
      ),
    },
    {
      key: 'difficulty',
      header: '난이도',
      render: (row) => {
        const level = row.meta.difficulty_level;
        const variant = level === 'Virtuoso' ? 'error' : level === 'Advanced' ? 'warning' : level === 'Intermediate' ? 'info' : 'success';
        return <StatusBadge label={getDifficultyLabel(level)} variant={variant} />;
      },
    },
    {
      key: 'verification',
      header: '검증상태',
      render: (row) => {
        const status = row.verification_status;
        const variant = status === 'Verified' ? 'success' : status === 'Needs Review' ? 'warning' : 'neutral';
        return <StatusBadge label={getVerificationLabel(status)} variant={variant} />;
      },
    },
    {
      key: 'date',
      header: '분석일',
      render: (row) => (
        <span className="text-gray-500 text-xs">
          {row.updated_at ? new Date(row.updated_at).toLocaleDateString('ko-KR') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleReanalyze(row); }}
            disabled={reanalyzingId === row.id}
            className="p-1.5 rounded-md hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors disabled:opacity-50"
            title="재분석"
          >
            {reanalyzingId === row.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
            className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">곡 DB / AI 분석 관리</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="전체 분석 수" value={analyses.length} icon={Music} />
        <StatCard
          title="검증 완료"
          value={verified}
          icon={CheckCircle}
          changeType="positive"
          change={analyses.length ? `${Math.round((verified / analyses.length) * 100)}%` : '0%'}
        />
        <StatCard
          title="검수 필요"
          value={needsReview}
          icon={AlertTriangle}
          changeType={needsReview > 0 ? 'negative' : 'neutral'}
          change={needsReview > 0 ? '확인 필요' : undefined}
        />
      </div>

      {/* 새 곡 분석 */}
      <ChartCard title="새 곡 분석하기" description="작곡가와 곡 제목을 입력하여 AI 분석을 시작합니다">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">작곡가</label>
            <input
              type="text"
              value={newComposer}
              onChange={(e) => setNewComposer(e.target.value)}
              placeholder="예: Chopin"
              disabled={analyzing}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">곡 제목</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="예: Ballade No.1 in G minor, Op.23"
              disabled={analyzing}
              onKeyDown={(e) => { if (e.key === 'Enter' && !analyzing) handleAnalyze(); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !newComposer.trim() || !newTitle.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            분석 시작
          </button>
        </div>
        {analyzeStatus && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${analyzeStatus.includes('실패') || analyzeStatus.includes('오류') ? 'text-red-600' : analyzeStatus.includes('완료') ? 'text-green-600' : 'text-violet-600'}`}>
            {analyzing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {analyzeStatus}
          </div>
        )}
      </ChartCard>

      {/* 분석 목록 */}
      <ChartCard title="분석 목록" description={`총 ${analyses.length}개의 AI 분석 데이터`}>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            로딩 중...
          </div>
        ) : (
          <DataTable columns={columns} data={analyses} emptyMessage="아직 분석된 곡이 없습니다" onRowClick={(row) => setDetailTarget(row)} />
        )}
      </ChartCard>

      {/* 상세 보기 모달 */}
      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailTarget(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full mx-4 shadow-xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{detailTarget._composer} - {detailTarget._title}</h3>
                {detailTarget.meta.opus && <p className="text-sm text-gray-500">{detailTarget.meta.opus} · {detailTarget.meta.key}</p>}
              </div>
              <button onClick={() => setDetailTarget(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 본문 */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* 1. 작곡가 배경 */}
              <section>
                <h4 className="text-sm font-bold text-violet-700 mb-2">작곡가 배경</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{detailTarget.content.composer_background}</p>
              </section>

              {/* 2. 시대적 상황 */}
              <section>
                <h4 className="text-sm font-bold text-violet-700 mb-2">시대적 상황</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{detailTarget.content.historical_context}</p>
              </section>

              {/* 3. 작품 배경 */}
              <section>
                <h4 className="text-sm font-bold text-violet-700 mb-2">작품 배경</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{detailTarget.content.work_background}</p>
              </section>

              {/* 4. 곡 구조 */}
              <section>
                <h4 className="text-sm font-bold text-violet-700 mb-2">곡 구조</h4>
                <div className="space-y-3">
                  {detailTarget.content.structure_analysis.map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900">{s.section}</span>
                        {s.measures && <span className="text-xs text-gray-400">마디 {s.measures}</span>}
                        {s.key_tempo && <span className="text-xs text-violet-500">{s.key_tempo}</span>}
                      </div>
                      {s.character && <p className="text-xs text-gray-500 mb-1">{s.character}</p>}
                      <p className="text-sm text-gray-700">{s.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5. 테크닉 팁 */}
              <section>
                <h4 className="text-sm font-bold text-violet-700 mb-2">테크닉 팁</h4>
                <div className="space-y-3">
                  {detailTarget.content.technique_tips.map((t, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900">{t.section}</span>
                        {t.category && <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded">{t.category}</span>}
                      </div>
                      <p className="text-sm text-red-600 mb-1">문제: {t.problem}</p>
                      <p className="text-sm text-green-700 mb-1">해결: {t.solution}</p>
                      <p className="text-sm text-blue-700">연습법: {t.practice}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 6. 음악적 해석 */}
              <section>
                <h4 className="text-sm font-bold text-violet-700 mb-2">음악적 해석</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{detailTarget.content.musical_interpretation}</p>
              </section>

              {/* 7. 추천 연주 */}
              <section>
                <h4 className="text-sm font-bold text-violet-700 mb-2">추천 연주</h4>
                <div className="space-y-2">
                  {detailTarget.content.recommended_performances.map((p, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                      <div>
                        <span className="font-semibold text-sm text-gray-900">{p.artist}</span>
                        <span className="text-xs text-gray-400 ml-2">({p.year})</span>
                        <p className="text-sm text-gray-600 mt-0.5">{p.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">분석 삭제</h3>
            <p className="text-sm text-gray-600 mb-1">
              다음 분석 데이터를 삭제하시겠습니까?
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">
              {deleteTarget._composer} - {deleteTarget._title}
            </p>
            <p className="text-xs text-red-500 mb-4">
              이 작업은 되돌릴 수 없습니다. 일반 사용자도 이 곡의 분석 결과를 볼 수 없게 됩니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
