"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import { ArrowLeft, Brain, Loader2, Music, User } from "lucide-react";
import { getComposers, type Composer } from "@/lib/queries/composers";
import { addUserAnalysis } from "@/lib/user-analyses";

interface SearchItem {
  composer: string;
  fullName: string;
  work: string;
}

interface ComposerEntry {
  composer: string;
  fullName: string;
}

import type { AnalyzeSongResponse } from "@/types/song-analysis";

export default function NewAnalysisPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [composers, setComposers] = useState<Composer[]>([]);

  // Supabase에서 작곡가 목록 로드
  useEffect(() => {
    getComposers().then(setComposers);
  }, []);

  // 작곡가 목록 (자동완성용)
  const composerList = useMemo<ComposerEntry[]>(
    () => composers.map((c) => ({ composer: c.shortName, fullName: c.fullName })),
    [composers]
  );

  // 검색을 위한 통합 리스트
  const searchableItems = useMemo<SearchItem[]>(
    () =>
      composers.flatMap((c) =>
        c.works.map((work) => ({ composer: c.shortName, fullName: c.fullName, work }))
      ),
    [composers]
  );

  // 작곡가 자동완성
  const [composerSuggestions, setComposerSuggestions] = useState<ComposerEntry[]>([]);
  const [showComposerSuggestions, setShowComposerSuggestions] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);

  // 곡 제목 자동완성
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  // 작곡가 필터링
  const filterComposers = (query: string) => {
    if (query.length < 2) {
      setComposerSuggestions([]);
      setShowComposerSuggestions(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = composerList.filter(
      (c) =>
        c.composer.toLowerCase().includes(lowerQuery) ||
        c.fullName.toLowerCase().includes(lowerQuery)
    );

    setComposerSuggestions(filtered);
    setShowComposerSuggestions(filtered.length > 0);
  };

  // 선택된 작곡가의 곡 목록 필터링
  const filterTitles = (query: string) => {
    if (query.length < 2) {
      setTitleSuggestions([]);
      setShowTitleSuggestions(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    let works: string[] = [];

    // 선택된 작곡가가 있으면 그 작곡가의 곡만 필터링
    if (composer) {
      const selectedComposer = composers.find(
        (c) => c.shortName === composer || c.fullName === composer
      );
      if (selectedComposer) {
        works = selectedComposer.works.filter((w) =>
          w.toLowerCase().includes(lowerQuery)
        );
      }
    } else {
      // 선택된 작곡가가 없을 때만 전체에서 검색
      works = searchableItems
        .filter((item) => item.work.toLowerCase().includes(lowerQuery))
        .map((item) => `${item.work} (${item.composer})`);
      // 중복 제거
      works = [...new Set(works)];
    }

    setTitleSuggestions(works.slice(0, 8));
    setShowTitleSuggestions(works.length > 0);
  };

  // 작곡가 선택
  const selectComposer = (item: ComposerEntry) => {
    setComposer(item.composer);
    setShowComposerSuggestions(false);
    setTitle(""); // 작곡가 변경 시 곡 제목 초기화
  };

  // 곡 제목 선택
  const selectTitle = (work: string) => {
    // "(작곡가)" 부분이 있으면 분리
    const match = work.match(/^(.+) \((.+)\)$/);
    if (match) {
      setTitle(match[1]);
      setComposer(match[2]);
    } else {
      setTitle(work);
    }
    setShowTitleSuggestions(false);
  };

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(event.target as Node)) {
        setShowComposerSuggestions(false);
      }
      if (titleRef.current && !titleRef.current.contains(event.target as Node)) {
        setShowTitleSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleComposerChange = (value: string) => {
    setComposer(value);
    filterComposers(value);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    filterTitles(value);
  };

  const [analyzeError, setAnalyzeError] = useState("");
  const [analyzePhase, setAnalyzePhase] = useState("");

  const handleAnalyze = async () => {
    if (!title || !composer) return;

    setIsAnalyzing(true);
    setAnalyzeError("");
    setAnalyzePhase("AI 분석 요청 중...");

    try {
      const res = await fetch("/api/analyze-song-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ composer, title, useV2: true }),
      });

      const result: AnalyzeSongResponse = await res.json();

      if (!result.success || !result.data) {
        setAnalyzeError(result.error || "분석에 실패했습니다. 다시 시도해주세요.");
        setIsAnalyzing(false);
        return;
      }

      // 사용자 분석 기록에 추가
      addUserAnalysis({ id: result.data.id, composer, title });

      setAnalyzePhase("분석 완료! 이동 중...");
      router.push(`/ai-analysis/${result.data.id}`);
    } catch {
      setAnalyzeError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = title.trim() && composer.trim();

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => safeBack(router)}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">새 곡 분석</h1>
          <p className="text-xs text-muted-foreground">곡 정보를 입력하세요</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        {/* Composer */}
        <div className="relative" ref={composerRef}>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            작곡가 *
          </label>
          <input
            type="text"
            placeholder="예: Chopin, Bach, Mozart"
            value={composer}
            onChange={(e) => handleComposerChange(e.target.value)}
            onFocus={() => {
              if (composer.length >= 2) filterComposers(composer);
            }}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground mt-1">2글자 이상 입력하면 자동완성됩니다</p>

          {/* Composer Suggestions */}
          {showComposerSuggestions && composerSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
              {composerSuggestions.map((item, index) => (
                <button
                  key={`${item.composer}-${index}`}
                  onClick={() => selectComposer(item)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{item.composer}</p>
                    <p className="text-xs text-muted-foreground">{item.fullName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="relative" ref={titleRef}>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            곡 제목 *
          </label>
          <input
            type="text"
            placeholder={composer ? `${composer}의 곡 검색...` : "예: Ballade, Sonata, Nocturne"}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onFocus={() => {
              if (title.length >= 2) filterTitles(title);
            }}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {/* Title Suggestions */}
          {showTitleSuggestions && titleSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
              {titleSuggestions.map((work, index) => (
                <button
                  key={`${work}-${index}`}
                  onClick={() => selectTitle(work)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-violet-600" />
                  </div>
                  <p className="font-medium text-foreground text-sm truncate">{work}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* What AI Analyzes */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          AI가 분석하는 항목
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">곡 배경</strong> - 작곡 시기, 헌정, 초연 정보</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">작곡가 설명</strong> - 생애, 음악적 특징</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">시대적 맥락</strong> - 음악사적 위치, 영향</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">형식·주제·동기</strong> - 구조 분석</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">화성 진행</strong> - 로마숫자 분석 (I-IV-V-I 등)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">연습 포인트</strong> - 템포, 페달, 프레이징 제안</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">참고 자료</strong> - 관련 논문, 레퍼런스 링크</span>
          </li>
        </ul>
      </div>

      {/* Notice */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>정확성 안내:</strong> AI는 검증된 음악학 자료를 바탕으로 분석합니다.
          불확실한 정보는 제공하지 않으며, 출처를 명시합니다.
        </p>
      </div>

      {/* Error */}
      {analyzeError && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 mb-4">
          <p className="text-sm text-red-700">{analyzeError}</p>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!canAnalyze || isAnalyzing}
        className="w-full py-4 rounded-xl bg-primary text-white font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {analyzePhase || "분석 중..."}
          </>
        ) : (
          <>
            <Brain className="w-5 h-5" />
            AI 분석 시작
          </>
        )}
      </button>

      {isAnalyzing && (
        <p className="text-xs text-center text-gray-400 mt-2">
          첫 분석은 1~2분 정도 소요됩니다. 이미 분석된 곡은 즉시 표시됩니다.
        </p>
      )}
    </div>
  );
}
