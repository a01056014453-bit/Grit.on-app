"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { safeBack } from "@/lib/navigation";
import {
  ArrowLeft,
  Search,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Music2,
  BarChart3,
  Target,
  Folder,
  FolderOpen,
  Trash2,
  Loader2,
  Brain,
} from "lucide-react";
import {
  getAnalyzedPieces,
  getPieceAnalysis,
  getUserPracticeData,
} from "@/lib/queries/pieces";
import type { Piece, PieceAnalysis, PiecePracticeData } from "@/lib/queries/pieces";
import { getUserId } from "@/lib/user-id";
import { addUserAnalysis, removeUserAnalysis } from "@/lib/user-analyses";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { ComposerAutocomplete, TitleAutocomplete, loadComposerImages } from "@/components/ui/composer-autocomplete";

// ── 타입 ──

interface UserAnalysis {
  id: string;
  composer: string;
  title: string;
  analyzedAt: string;
}

interface AnalysisStartResponse {
  success: boolean;
  error?: string;
  cached?: boolean;
  result_id?: string;
  job_id?: string;
}

interface JobStatusResponse {
  success: boolean;
  status: "processing" | "done" | "failed";
  result_id?: string;
  error_message?: string;
}

interface SectionData {
  startMeasure: number;
  endMeasure: number;
  sectionName: string;
  technicalDifficulty: string;
  dynamics: string;
}

interface MeasureProgressData {
  measureStart: number;
  mastery: string;
}

// ── 유틸 ──

function getUserInstrument(): string {
  if (typeof window === "undefined") return "piano";
  try {
    const raw = localStorage.getItem("sempre-user-profile");
    if (!raw) return "piano";
    const parsed = JSON.parse(raw);
    const inst = parsed.instruments?.[0];
    if (!inst || typeof inst !== "string") return "piano";
    const map: Record<string, string> = {
      "피아노": "piano", "바이올린": "violin", "첼로": "cello",
      "비올라": "viola", "플루트": "flute", "클라리넷": "clarinet", "기타": "guitar",
    };
    return map[inst] ?? inst;
  } catch { return "piano"; }
}

// ── 상수 ──

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-orange-100 text-orange-700",
  very_hard: "bg-red-100 text-red-700",
};
const difficultyLabels: Record<string, string> = {
  easy: "쉬움", medium: "보통", hard: "어려움", very_hard: "매우 어려움",
};
const masteryColors: Record<string, string> = {
  not_started: "bg-gray-200", learning: "bg-yellow-400",
  practicing: "bg-blue-400", mastered: "bg-green-500",
};

// ── 인라인 분석 폼 ──

function InlineAnalysisForm({ onAnalyzed }: { onAnalyzed: (id: string, composer: string, title: string) => void }) {
  const router = useRouter();
  const [composer, setComposer] = useState("");
  const [title, setTitle] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingComposer, setPollingComposer] = useState("");
  const [pollingTitle, setPollingTitle] = useState("");
  const [error, setError] = useState("");

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const startPolling = useCallback((jobId: string, comp: string, ttl: string) => {
    let errorCount = 0;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analyze-song-v2/status?job_id=${jobId}`);
        const data: JobStatusResponse = await res.json();
        if (data.status === "done" && data.result_id) {
          stopPolling();
          setIsPolling(false);
          trackEvent({ event: "analysis_completed", properties: { composer: comp, title: ttl, cached: false } });
          onAnalyzed(data.result_id, comp, ttl);
          router.push(`/ai-analysis/${data.result_id}`);
        } else if (data.status === "failed") {
          stopPolling();
          setIsPolling(false);
          trackEvent({ event: "analysis_failed", properties: { composer: comp, title: ttl, error: data.error_message } });
          setError(data.error_message ?? "분석에 실패했습니다.");
        }
        errorCount = 0;
      } catch {
        errorCount++;
        if (errorCount >= 10) {
          stopPolling();
          setIsPolling(false);
          setError("서버 연결이 불안정합니다. 잠시 후 다시 시도해주세요.");
        }
      }
    }, 3000);
    pollingRef.current = interval;
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setIsPolling(false);
      setError("분석 시간이 초과되었습니다. 다시 시도해주세요.");
    }, 10 * 60 * 1000);
  }, [stopPolling, onAnalyzed, router]);

  const handleAnalyze = async () => {
    if (!composer.trim() || !title.trim()) return;
    setIsStarting(true);
    setError("");
    trackEvent({ event: "analysis_request", properties: { composer: composer.trim(), title: title.trim() } });
    try {
      const res = await fetch("/api/analyze-song-v2/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          composer: composer.trim(),
          title: title.trim(),
          instrument: getUserInstrument(),
          analysisVersion: 3,
        }),
      });
      const result: AnalysisStartResponse = await res.json();
      if (!result.success) {
        setError(result.error || "분석 시작에 실패했습니다.");
        setIsStarting(false);
        return;
      }
      if (result.cached && result.result_id) {
        onAnalyzed(result.result_id, composer.trim(), title.trim());
        setIsStarting(false);
        router.push(`/ai-analysis/${result.result_id}`);
        return;
      }
      if (result.job_id) {
        setPollingComposer(composer.trim());
        setPollingTitle(title.trim());
        setIsStarting(false);
        setIsPolling(true);
        setComposer("");
        setTitle("");
        startPolling(result.job_id, composer.trim(), title.trim());
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setIsStarting(false);
    }
  };

  return (
    <div className="mb-6">
      {isPolling && (
        <div className="mb-3 px-4 py-3 bg-violet-50 border border-violet-200 rounded-xl flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-violet-500 animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-violet-700 truncate">
              {pollingComposer} - {pollingTitle}
            </p>
            <p className="text-xs text-violet-500">AI 분석 중... 완료되면 자동으로 추가됩니다</p>
          </div>
          <button onClick={() => { stopPolling(); setIsPolling(false); }} className="text-xs text-violet-400 hover:text-violet-600 shrink-0">
            취소
          </button>
        </div>
      )}

      <ComposerAutocomplete
        value={composer}
        onChange={(v) => { setComposer(v); setTitle(""); }}
        placeholder="작곡가 (예: Chopin)"
        className="mb-3"
      />
      <TitleAutocomplete
        value={title}
        onChange={setTitle}
        composer={composer}
        placeholder="곡 제목 (예: Ballade No.1)"
        className="mb-3"
      />

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <button
        onClick={handleAnalyze}
        disabled={isStarting || isPolling || !composer.trim() || !title.trim()}
        className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isStarting ? (
          <><Loader2 className="w-4 h-4 animate-spin" />분석 시작 중...</>
        ) : (
          <><Brain className="w-4 h-4" />AI 분석 시작</>
        )}
      </button>
    </div>
  );
}

// ── 스와이프 삭제 아이템 (작곡가 얼굴 이미지) ──

function SwipeableAnalysisItem({ analysis, onDelete, composerImages }: {
  analysis: UserAnalysis;
  onDelete: (id: string) => void;
  composerImages: Record<string, string>;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const swipeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const DELETE_THRESHOLD = 70;

  // 작곡가 이미지 매칭 (캐시된 images에서 찾기)
  const composerImageUrl = (() => {
    const match = Object.entries(composerImages).find(([fullName]) =>
      fullName.toLowerCase().includes(analysis.composer.toLowerCase()) ||
      analysis.composer.toLowerCase().includes(fullName.split(" ").pop()?.toLowerCase() ?? "")
    );
    return match?.[1] ?? null;
  })();

  const applyTransform = useCallback((x: number, animate: boolean) => {
    const el = swipeRef.current;
    if (!el) return;
    el.classList.toggle("transition-transform", animate);
    el.classList.toggle("duration-200", animate);
    el.classList.toggle("ease-out", animate);
    el.style.transform = `translateX(${x}px)`;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentXRef.current = 0;
    isHorizontalRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;
    if (isHorizontalRef.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontalRef.current) return;
    e.preventDefault();
    const clampedX = Math.min(0, Math.max(-DELETE_THRESHOLD, dx));
    currentXRef.current = clampedX;
    setShowDelete(clampedX < 0);
    applyTransform(clampedX, false);
  }, [applyTransform]);

  const handleTouchEnd = useCallback(() => {
    const snapOpen = currentXRef.current <= -DELETE_THRESHOLD * 0.6;
    setShowDelete(snapOpen);
    applyTransform(snapOpen ? -DELETE_THRESHOLD : 0, true);
    isHorizontalRef.current = null;
  }, [applyTransform]);

  const handleDelete = useCallback(() => {
    applyTransform(0, true);
    setShowDelete(false);
    onDelete(analysis.id);
  }, [analysis.id, onDelete, applyTransform]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {showDelete && (
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button onClick={handleDelete} className="h-full w-[70px] bg-red-500 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
      <div ref={swipeRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <Link
          href={`/ai-analysis/${analysis.id}`}
          className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-violet-300 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {composerImageUrl ? (
              <img src={composerImageUrl} alt="" className="w-10 h-10 object-cover" />
            ) : (
              <Sparkles className="w-5 h-5 text-violet-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-black truncate">
              {analysis.composer} - {analysis.title}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(analysis.analyzedAt).toLocaleDateString("ko-KR")} 분석
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </Link>
      </div>
    </div>
  );
}

// ── 메인 페이지 ──

export default function AIAnalysisPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPieceId, setExpandedPieceId] = useState<string | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [analysisData, setAnalysisData] = useState<Record<string, PieceAnalysis>>({});
  const [practiceData, setPracticeData] = useState<Record<string, PiecePracticeData>>({});
  const [userAnalyses, setUserAnalyses] = useState<UserAnalysis[]>([]);
  const [composerImages, setComposerImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const handleDeleteAnalysis = useCallback(async (id: string) => {
    removeUserAnalysis(id);
    setUserAnalyses((prev) => prev.filter((x) => x.id !== id));
    try {
      const res = await fetch("/api/song-analysis/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) console.error("[deleteAnalysis] DB 삭제 실패:", res.status);
    } catch (err) {
      console.error("[deleteAnalysis] 오류:", err);
    }
  }, []);

  // 마이그레이션
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEYS.MIGRATION_DONE)) return;

    function chunk<T>(arr: T[], size: number): T[][] {
      const result: T[][] = [];
      for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
      return result;
    }

    async function migrateLocalData() {
      try {
        const rawAnalyses = localStorage.getItem(STORAGE_KEYS.USER_ANALYSES);
        const allAnalysisIds: string[] = [];
        const allPairs: { composer: string; title: string }[] = [];
        if (rawAnalyses) {
          try {
            const parsed = JSON.parse(rawAnalyses) as { id: string; composer: string; title: string }[];
            for (const item of parsed) {
              if (item.id) allAnalysisIds.push(item.id);
              if (item.composer && item.title) allPairs.push({ composer: item.composer, title: item.title });
            }
          } catch {}
        }
        const rawLibrary = localStorage.getItem(STORAGE_KEYS.MY_LIBRARY);
        if (rawLibrary) {
          try {
            const keys = JSON.parse(rawLibrary) as string[];
            for (const key of keys) {
              const parts = key.split("__");
              if (parts.length === 2) allPairs.push({ composer: parts[0], title: parts[1] });
            }
          } catch {}
        }
        if (allAnalysisIds.length === 0 && allPairs.length === 0) {
          localStorage.setItem(STORAGE_KEYS.MIGRATION_DONE, "true");
          return;
        }
        const idBatches = chunk(allAnalysisIds, 100);
        const pairBatches = chunk(allPairs, 100);
        const maxBatches = Math.max(idBatches.length, pairBatches.length);
        let hasError = false;
        for (let i = 0; i < maxBatches; i++) {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 10000);
          try {
            const res = await fetch("/api/song-analysis/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ analysisIds: idBatches[i] ?? [], composerTitlePairs: pairBatches[i] ?? [] }),
              signal: controller.signal,
            });
            if (!res.ok) hasError = true;
          } catch { hasError = true; }
          finally { clearTimeout(tid); }
        }
        localStorage.setItem(STORAGE_KEYS.MIGRATION_DONE, "true");
        if (!hasError) {
          localStorage.removeItem(STORAGE_KEYS.USER_ANALYSES);
          localStorage.removeItem(STORAGE_KEYS.MY_LIBRARY);
        }
      } catch (err) {
        console.error("[migration] 실패:", err);
      }
    }
    migrateLocalData();
  }, []);

  // 데이터 로드
  useEffect(() => {
    async function load() {
      const userId = getUserId();

      // 작곡가 이미지 한 번 로드
      loadComposerImages().then(setComposerImages);

      // 분석 목록
      try {
        const res = await fetch("/api/analyses", { credentials: "include" });
        if (res.status === 401) {
          setUserAnalyses([]);
        } else if (res.ok) {
          const { data: dbList } = await res.json();
          if (dbList) {
            setUserAnalyses(
              (dbList as { id: string; composer: string; title: string; updatedAt: string }[]).map(
                (item) => ({ id: item.id, composer: item.composer, title: item.title, analyzedAt: item.updatedAt || "" })
              )
            );
          }
        } else {
          setUserAnalyses([]);
        }
      } catch { setUserAnalyses([]); }

      // 마디별 분석 곡
      const fetchedPieces = await getAnalyzedPieces();
      setPieces(fetchedPieces);
      const analyses: Record<string, PieceAnalysis> = {};
      const practices: Record<string, PiecePracticeData> = {};
      await Promise.all(
        fetchedPieces.map(async (piece: Piece) => {
          const a = await getPieceAnalysis(piece.id);
          if (a) analyses[piece.id] = a;
          if (userId) {
            const p = await getUserPracticeData(userId, piece.id);
            if (p) practices[piece.id] = p;
          }
        })
      );
      setAnalysisData(analyses);
      setPracticeData(practices);
      setLoading(false);
    }
    load();
  }, []);

  const filteredPieces = pieces.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.composerShortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.composerFullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUserAnalyses = userAnalyses.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.composer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = userAnalyses.length + pieces.length;

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    if (m >= 60) return `${Math.floor(m / 60)}시간 ${m % 60}분`;
    return `${m}분`;
  };

  const formatPracticeTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  };

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
        <div className="bg-blob-extra" />
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/20 rounded-xl" />
          <div className="h-24 bg-white/20 rounded-xl" />
          <div className="h-48 bg-white/20 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => safeBack(router)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-black">AI 곡 분석</h1>
          <p className="text-xs text-gray-500">AI 분석 완료된 곡 {totalCount}개</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
          <Folder className="w-5 h-5 text-violet-600" />
        </div>
      </div>

      {/* 분석 입력 */}
      <InlineAnalysisForm
        onAnalyzed={(id, composer, title) => {
          addUserAnalysis({ id, composer, title });
          setUserAnalyses((prev) => [
            { id, composer, title, analyzedAt: new Date().toISOString() },
            ...prev.filter((a) => a.id !== id),
          ]);
        }}
      />

      {/* 검색 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="곡 이름, 작곡가로 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      {/* AI 분석한 곡 */}
      {filteredUserAnalyses.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-black flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-500" />
            AI 분석한 곡
          </h2>
          <div className="space-y-2">
            {filteredUserAnalyses.map((a) => (
              <SwipeableAnalysisItem
                key={a.id}
                analysis={a}
                onDelete={handleDeleteAnalysis}
                composerImages={composerImages}
              />
            ))}
          </div>
        </div>
      )}

      {/* 마디별 분석 곡 */}
      {pieces.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-black flex items-center gap-2 mb-3">
            <Music2 className="w-4 h-4 text-gray-500" />
            마디별 분석 곡
          </h2>
          <div className="space-y-3">
            {filteredPieces.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-200">
                검색 결과가 없습니다
              </div>
            ) : (
              filteredPieces.map((piece) => {
                const analysis = analysisData[piece.id];
                const practice = practiceData[piece.id];
                const isExpanded = expandedPieceId === piece.id;
                return (
                  <div key={piece.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedPieceId(isExpanded ? null : piece.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                        {isExpanded ? <FolderOpen className="w-5 h-5 text-violet-600" /> : <Folder className="w-5 h-5 text-violet-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black truncate">{piece.composerShortName} - {piece.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{piece.opus}</span>
                          {piece.key && <span className="text-xs text-gray-400">• {piece.key}</span>}
                        </div>
                      </div>
                      {practice && (
                        <div className="text-right shrink-0 mr-2">
                          <p className="text-xs font-semibold text-violet-600">{practice.completionPercentage}%</p>
                          <p className="text-xs text-gray-400">완성도</p>
                        </div>
                      )}
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
                    </button>

                    {isExpanded && analysis && (() => {
                      const sections = (Array.isArray(analysis.sections) ? analysis.sections : []) as unknown as SectionData[];
                      const measureProgress = (practice?.measureProgress ? (Array.isArray(practice.measureProgress) ? practice.measureProgress : []) : []) as unknown as MeasureProgressData[];
                      return (
                        <div className="border-t border-gray-100 bg-gray-50">
                          <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100">
                            <div className="text-center">
                              <p className="text-lg font-bold text-black">{analysis.totalMeasures}</p>
                              <p className="text-xs text-gray-500">마디</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-black">{formatDuration(analysis.estimatedDuration ?? 0)}</p>
                              <p className="text-xs text-gray-500">연주시간</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-black">{sections.length}</p>
                              <p className="text-xs text-gray-500">섹션</p>
                            </div>
                          </div>
                          {practice && (
                            <div className="p-4 border-b border-gray-100">
                              <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="w-4 h-4 text-violet-500" />
                                <span className="text-xs font-semibold text-black">내 연습 현황</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                <div><span className="text-gray-500">총 연습: </span><span className="font-medium">{formatPracticeTime(practice.totalPracticeTime)}</span></div>
                                <div><span className="text-gray-500">세션: </span><span className="font-medium">{practice.sessionCount}회</span></div>
                                {practice.averageAccuracy && <div><span className="text-gray-500">정확도: </span><span className="font-medium">{practice.averageAccuracy}%</span></div>}
                              </div>
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="w-4 h-4 text-gray-500" />
                              <span className="text-xs font-semibold text-black">마디별 분석</span>
                            </div>
                            <div className="space-y-2">
                              {sections.map((section, idx) => {
                                const sp = measureProgress.find((p) => p.measureStart === section.startMeasure);
                                return (
                                  <Link key={idx} href={`/ai-analysis/${piece.id}/section/${idx}`}
                                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-violet-200 transition-colors">
                                    <div className="flex flex-col items-center shrink-0">
                                      <span className="text-xs font-bold text-gray-600">{section.startMeasure}-{section.endMeasure}</span>
                                      <span className="text-[10px] text-gray-400">마디</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-black truncate">{section.sectionName}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-gray-400">{section.dynamics}</span>
                                      </div>
                                    </div>
                                    {sp && <div className={`w-3 h-3 rounded-full shrink-0 ${masteryColors[sp.mastery]}`} />}
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                          <div className="p-4 pt-0">
                            <Link href={`/ai-analysis/${piece.id}`}
                              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-500 to-violet-900 text-white rounded-xl text-sm font-semibold">
                              <Sparkles className="w-4 h-4" />전체 분석 보기
                            </Link>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {filteredUserAnalyses.length === 0 && filteredPieces.length === 0 && (
        <div className="py-12 text-center text-gray-500 text-sm">
          {searchQuery ? "검색 결과가 없습니다" : "아직 분석한 곡이 없습니다"}
        </div>
      )}
    </div>
  );
}
