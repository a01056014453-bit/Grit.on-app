'use client';

import { useEffect, useState, useCallback } from 'react';
import { Music, CheckCircle, AlertTriangle, Plus, RefreshCw, Trash2, Loader2, X, FileText, Eye, Upload, Filter } from 'lucide-react';
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // 재분석 중인 항목
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<AnalysisListItem | null>(null);

  // 상세 보기
  const [detailTarget, setDetailTarget] = useState<AnalysisListItem | null>(null);

  // 필터
  type FilterType = 'all' | 'needs_review' | 'verified' | 'with_sheet';
  const [filter, setFilter] = useState<FilterType>('all');

  // 기존 곡 악보 업로드
  const [uploadingSheetFor, setUploadingSheetFor] = useState<string | null>(null);

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
  const withSheetMusic = analyses.filter((a) => a.pdf_storage_path || a.musicxml_storage_path).length;

  // 새 곡 분석 (PDF/MusicXML 첨부 지원)
  const handleAnalyze = async () => {
    if (!newComposer.trim() || !newTitle.trim()) return;
    setAnalyzing(true);

    const composer = newComposer.trim();
    const title = newTitle.trim();

    try {
      const requestBody: Record<string, unknown> = { composer, title, forceRefresh: true };

      if (uploadedFile) {
        const ext = uploadedFile.name.toLowerCase();
        const isPdf = ext.endsWith('.pdf');
        const isMusicXml = ext.endsWith('.xml') || ext.endsWith('.musicxml') || ext.endsWith('.mxl');

        // 1) Supabase Storage에 원본 업로드
        setAnalyzeStatus('악보 파일 업로드 중...');
        const uploadForm = new FormData();
        uploadForm.append('file', uploadedFile);
        uploadForm.append('composer', composer);
        uploadForm.append('title', title);
        uploadForm.append('fileType', isPdf ? 'pdf' : 'musicxml');
        try {
          const uploadRes = await fetch('/api/upload-sheet-music', { method: 'POST', body: uploadForm });
          if (uploadRes.ok) {
            const uploadResult = await uploadRes.json();
            if (uploadResult.success) {
              if (isPdf) requestBody.pdfStoragePath = uploadResult.path;
              else requestBody.musicxmlStoragePath = uploadResult.path;
            }
          }
        } catch { /* 업로드 실패해도 분석 계속 */ }

        // 2) MusicXML이면 텍스트 읽어서 전달
        if (isMusicXml) {
          setAnalyzeStatus('MusicXML 분석 중... (1-2분 소요)');
          const xmlText = await uploadedFile.text();
          requestBody.musicXml = xmlText;
        }

        // 3) PDF면 변환 시도
        if (isPdf) {
          // MusicXML 변환 시도
          setAnalyzeStatus('PDF → MusicXML 변환 중...');
          let converted = false;
          try {
            const formData = new FormData();
            formData.append('file', uploadedFile);
            const xmlRes = await fetch('/api/convert-pdf?format=musicxml', {
              method: 'POST',
              body: formData,
              signal: AbortSignal.timeout(630000),
            });
            if (xmlRes.ok) {
              const xmlResult = await xmlRes.json();
              if (xmlResult.success && xmlResult.musicxml) {
                requestBody.musicXml = xmlResult.musicxml;
                converted = true;
              }
            }
          } catch { /* fallback to images */ }

          // 이미지 변환 fallback
          if (!converted) {
            setAnalyzeStatus('PDF → 이미지 변환 중...');
            try {
              const imgForm = new FormData();
              imgForm.append('file', uploadedFile);
              const imgRes = await fetch('/api/convert-pdf', { method: 'POST', body: imgForm });
              if (imgRes.ok) {
                const imgResult = await imgRes.json();
                if (imgResult.images) {
                  requestBody.sheetMusicImages = imgResult.images;
                }
              }
            } catch { /* 변환 실패 시 텍스트 분석으로 진행 */ }
          }

          setAnalyzeStatus('AI 악보 기반 분석 중... (1-3분 소요)');
        }
      } else {
        setAnalyzeStatus('AI 분석 중... (1-2분 소요)');
      }

      const res = await fetch('/api/analyze-song-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const json = await res.json();
      if (json.success) {
        setAnalyzeStatus('분석 완료!');
        setNewComposer('');
        setNewTitle('');
        setUploadedFile(null);
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

  // 악보 기반 재분석 (저장된 PDF/MusicXML 사용)
  const handleReanalyzeWithSource = async (item: AnalysisListItem) => {
    if (!confirm(`"${item._composer} - ${item._title}" 곡을 저장된 악보로 재분석하시겠습니까?\nPDF/MusicXML 기반으로 정밀 분석합니다.`)) return;
    setReanalyzingId(item.id);
    try {
      const res = await fetch('/api/analyze-song-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          composer: item._composer,
          title: item._title,
          forceRefresh: true,
          useStoredSource: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchAnalyses();
      } else {
        alert(`악보 재분석 실패: ${json.error}`);
      }
    } catch {
      alert('네트워크 오류');
    } finally {
      setReanalyzingId(null);
    }
  };

  // PDF 보기 (signed URL 생성 후 새 탭)
  const handleViewPdf = async (path: string) => {
    try {
      const res = await fetch(`/api/upload-sheet-music?path=${encodeURIComponent(path)}`);
      const json = await res.json();
      if (json.success && json.url) {
        window.open(json.url, '_blank');
      } else {
        alert('PDF URL 생성 실패');
      }
    } catch {
      alert('PDF 조회 오류');
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

  // 기존 곡에 악보 파일 업로드
  const handleUploadSheet = async (item: AnalysisListItem, file: File) => {
    setUploadingSheetFor(item.id);
    try {
      const ext = file.name.toLowerCase();
      const isPdf = ext.endsWith('.pdf');

      // Supabase Storage 업로드
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('composer', item._composer);
      uploadForm.append('title', item._title);
      uploadForm.append('fileType', isPdf ? 'pdf' : 'musicxml');

      const uploadRes = await fetch('/api/upload-sheet-music', { method: 'POST', body: uploadForm });
      if (!uploadRes.ok) throw new Error('업로드 실패');
      const uploadResult = await uploadRes.json();
      if (!uploadResult.success) throw new Error('업로드 실패');

      // 분석 데이터에 storage path 업데이트 (재분석으로 연결)
      const body: Record<string, unknown> = {
        composer: item._composer,
        title: item._title,
        forceRefresh: true,
      };
      if (isPdf) body.pdfStoragePath = uploadResult.path;
      else body.musicxmlStoragePath = uploadResult.path;

      // PDF면 변환 시도
      if (isPdf) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const xmlRes = await fetch('/api/convert-pdf?format=musicxml', { method: 'POST', body: formData, signal: AbortSignal.timeout(630000) });
          if (xmlRes.ok) {
            const xmlResult = await xmlRes.json();
            if (xmlResult.success && xmlResult.musicxml) body.musicXml = xmlResult.musicxml;
          }
        } catch { /* fallback */ }

        if (!body.musicXml) {
          try {
            const imgForm = new FormData();
            imgForm.append('file', file);
            const imgRes = await fetch('/api/convert-pdf', { method: 'POST', body: imgForm });
            if (imgRes.ok) {
              const imgResult = await imgRes.json();
              if (imgResult.images) body.sheetMusicImages = imgResult.images;
            }
          } catch { /* fallback */ }
        }
      } else {
        body.musicXml = await file.text();
      }

      const res = await fetch('/api/analyze-song-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await fetchAnalyses();
      } else {
        alert(`악보 업로드 후 재분석 실패: ${json.error}`);
      }
    } catch {
      alert('악보 업로드 오류');
    } finally {
      setUploadingSheetFor(null);
    }
  };

  // 필터링된 데이터
  const filteredAnalyses = filter === 'all' ? analyses
    : filter === 'needs_review' ? analyses.filter((a) => a.verification_status === 'Needs Review')
    : filter === 'verified' ? analyses.filter((a) => a.verification_status === 'Verified')
    : analyses.filter((a) => a.pdf_storage_path || a.musicxml_storage_path);

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
      key: 'source',
      header: '악보',
      className: 'w-20',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.pdf_storage_path && (
            <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-medium">PDF</span>
          )}
          {row.musicxml_storage_path && (
            <span className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded font-medium">XML</span>
          )}
          {!row.pdf_storage_path && !row.musicxml_storage_path && (
            <span className="text-[10px] text-gray-300">-</span>
          )}
        </div>
      ),
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
      className: 'w-40',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.pdf_storage_path && (
            <button
              onClick={(e) => { e.stopPropagation(); handleViewPdf(row.pdf_storage_path!); }}
              className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
              title="PDF 보기"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {/* 악보 업로드 버튼 */}
          <label
            onClick={(e) => e.stopPropagation()}
            className={`p-1.5 rounded-md hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors cursor-pointer ${uploadingSheetFor === row.id ? 'opacity-50 pointer-events-none' : ''}`}
            title={row.pdf_storage_path ? '악보 교체' : '악보 업로드'}
          >
            {uploadingSheetFor === row.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <input
              type="file"
              accept=".pdf,.xml,.musicxml,.mxl"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadSheet(row, file);
                e.target.value = '';
              }}
            />
          </label>
          {(row.pdf_storage_path || row.musicxml_storage_path) && (
            <button
              onClick={(e) => { e.stopPropagation(); handleReanalyzeWithSource(row); }}
              disabled={reanalyzingId === row.id}
              className="p-1.5 rounded-md hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
              title="악보 기반 재분석"
            >
              {reanalyzingId === row.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleReanalyze(row); }}
            disabled={reanalyzingId === row.id}
            className="p-1.5 rounded-md hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors disabled:opacity-50"
            title="텍스트 재분석"
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
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="전체 분석 수"
          value={analyses.length}
          icon={Music}
          onClick={() => setFilter(filter === 'all' ? 'all' : 'all')}
          active={filter === 'all'}
        />
        <StatCard
          title="검증 완료"
          value={verified}
          icon={CheckCircle}
          changeType="positive"
          change={analyses.length ? `${Math.round((verified / analyses.length) * 100)}%` : '0%'}
          onClick={() => setFilter(filter === 'verified' ? 'all' : 'verified')}
          active={filter === 'verified'}
        />
        <StatCard
          title="검수 필요"
          value={needsReview}
          icon={AlertTriangle}
          changeType={needsReview > 0 ? 'negative' : 'neutral'}
          change={needsReview > 0 ? '클릭하여 확인' : undefined}
          onClick={() => setFilter(filter === 'needs_review' ? 'all' : 'needs_review')}
          active={filter === 'needs_review'}
        />
        <StatCard
          title="악보 보유"
          value={withSheetMusic}
          icon={FileText}
          changeType="neutral"
          change={analyses.length ? `${Math.round((withSheetMusic / analyses.length) * 100)}%` : '0%'}
          onClick={() => setFilter(filter === 'with_sheet' ? 'all' : 'with_sheet')}
          active={filter === 'with_sheet'}
        />
      </div>

      {/* 새 곡 분석 */}
      <ChartCard title="새 곡 분석하기" description="작곡가와 곡 제목을 입력하고, 악보 파일(PDF/MusicXML)을 첨부하면 정밀 분석합니다">
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
          <div className="flex-shrink-0">
            <label className="block text-xs font-medium text-gray-500 mb-1">악보 첨부</label>
            {uploadedFile ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg">
                <FileText className="w-4 h-4 text-violet-600 flex-shrink-0" />
                <span className="text-sm text-violet-700 truncate max-w-[140px]">{uploadedFile.name}</span>
                <button
                  onClick={() => setUploadedFile(null)}
                  disabled={analyzing}
                  className="p-0.5 hover:bg-violet-100 rounded transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5 text-violet-400" />
                </button>
              </div>
            ) : (
              <label className={`flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors ${analyzing ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">PDF / XML</span>
                <input
                  type="file"
                  accept=".pdf,.xml,.musicxml,.mxl"
                  className="hidden"
                  disabled={analyzing}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setUploadedFile(file);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
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
            {uploadedFile ? '악보 분석' : '분석 시작'}
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
      <ChartCard
        title="분석 목록"
        description={filter === 'all' ? `총 ${analyses.length}개의 AI 분석 데이터` : `${filteredAnalyses.length}개 필터됨 (전체 ${analyses.length}개)`}
        action={filter !== 'all' ? (
          <button
            onClick={() => setFilter('all')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            {filter === 'needs_review' ? '검수 필요' : filter === 'verified' ? '검증 완료' : '악보 보유'} 필터 해제
          </button>
        ) : undefined}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            로딩 중...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredAnalyses}
            emptyMessage={filter === 'needs_review' ? '검수 필요한 곡이 없습니다' : filter === 'with_sheet' ? '악보가 등록된 곡이 없습니다' : '아직 분석된 곡이 없습니다'}
            onRowClick={(row) => setDetailTarget(row)}
          />
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
                <div className="flex items-center gap-2 mt-1">
                  {detailTarget.meta.opus && <span className="text-sm text-gray-500">{detailTarget.meta.opus} · {detailTarget.meta.key}</span>}
                  {detailTarget.pdf_storage_path && (
                    <button
                      onClick={() => handleViewPdf(detailTarget.pdf_storage_path!)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      PDF 보기
                    </button>
                  )}
                  {detailTarget.musicxml_storage_path && (
                    <span className="text-xs px-2 py-0.5 bg-violet-50 text-violet-600 rounded-md">MusicXML 저장됨</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* 악보 업로드 버튼 */}
                <label className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer ${uploadingSheetFor === detailTarget.id ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingSheetFor === detailTarget.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {uploadingSheetFor === detailTarget.id ? '업로드 중...' : detailTarget.pdf_storage_path ? '악보 교체' : '악보 업로드'}
                  <input
                    type="file"
                    accept=".pdf,.xml,.musicxml,.mxl"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadSheet(detailTarget, file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                {(detailTarget.pdf_storage_path || detailTarget.musicxml_storage_path) && (
                  <button
                    onClick={() => { setDetailTarget(null); handleReanalyzeWithSource(detailTarget); }}
                    disabled={reanalyzingId === detailTarget.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    악보 재분석
                  </button>
                )}
                <button onClick={() => setDetailTarget(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
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
