"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import { ArrowLeft, Brain, Loader2, Music, User, Bell, CheckCircle2 } from "lucide-react";
import { getComposers, type Composer } from "@/lib/queries/composers";
import { addUserAnalysis } from "@/lib/user-analyses";

// ── 타입 정의 ──

interface ComposerEntry { composer: string; fullName: string; }
interface SearchItem { composer: string; fullName: string; work: string; }

/** POST /api/analyze-song-v2/start 응답 */
interface AnalysisStartResponse {
  success: boolean;
  error?: string;
  cached?: boolean;
  result_id?: string;
  job_id?: string;
  message?: string;
}

/** GET /api/analyze-song-v2/status 응답 */
interface JobStatusResponse {
  success: boolean;
  job_id: string;
  status: "processing" | "done" | "failed";
  result_id?: string;
  error_message?: string;
  composer: string;
  title: string;
  elapsed_seconds: number;
}

// ── 유틸 함수 ──

function getUserInstrument(): string {
  if (typeof window === "undefined") return "piano";
  try {
    const profile = localStorage.getItem("sempre-user-profile");
    if (profile) {
      const parsed = JSON.parse(profile);
      const inst = parsed.instruments?.[0];
      const map: Record<string, string> = {
        "피아노": "piano", "바이올린": "violin", "첼로": "cello",
        "비올라": "violin", "플루트": "flute", "클라리넷": "clarinet", "기타": "guitar",
      };
      return map[inst] ?? inst ?? "piano";
    }
  } catch {}
  return "piano";
}

function sendAnalysisCompleteNotification(composer: string, title: string, resultId: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification("분석 완료!", {
    body: `${composer} - ${title} 분석이 완료되었습니다.`,
    icon: "/icons/icon-192x192.png",
    tag: `analysis-${resultId}`,
    requireInteraction: true,
  });
  n.onclick = () => { window.focus(); window.location.href = `/ai-analysis/${resultId}`; n.close(); };
}

// ── 컴포넌트 ──

export default function NewAnalysisPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [composers, setComposers] = useState<Composer[]>([]);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  const [composerSuggestions, setComposerSuggestions] = useState<ComposerEntry[]>([]);
  const [showComposerSuggestions, setShowComposerSuggestions] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  // 폴링 interval ref (cleanup용)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getComposers().then(setComposers);
    if ("Notification" in window) setNotificationGranted(Notification.permission === "granted");
  }, []);

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, []);

  const composerList = useMemo<ComposerEntry[]>(
    () => composers.map((c) => ({ composer: c.shortName, fullName: c.fullName })), [composers]
  );
  const searchableItems = useMemo<SearchItem[]>(
    () => composers.flatMap((c) => c.works.map((work) => ({ composer: c.shortName, fullName: c.fullName, work }))), [composers]
  );

  const filterComposers = useCallback((query: string) => {
    if (query.length < 2) { setComposerSuggestions([]); setShowComposerSuggestions(false); return; }
    const q = query.toLowerCase();
    const filtered = composerList.filter((c) => c.composer.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q));
    setComposerSuggestions(filtered);
    setShowComposerSuggestions(filtered.length > 0);
  }, [composerList]);

  const filterTitles = useCallback((query: string) => {
    if (query.length < 2) { setTitleSuggestions([]); setShowTitleSuggestions(false); return; }
    const q = query.toLowerCase();
    let works: string[] = [];
    if (composer) {
      const sel = composers.find((c) => c.shortName === composer || c.fullName === composer);
      if (sel) works = sel.works.filter((w) => w.toLowerCase().includes(q));
    } else {
      works = [...new Set(searchableItems.filter((i) => i.work.toLowerCase().includes(q)).map((i) => `${i.work} (${i.composer})`))];
    }
    setTitleSuggestions(works.slice(0, 8));
    setShowTitleSuggestions(works.length > 0);
  }, [composer, composers, searchableItems]);

  const selectComposer = useCallback((item: ComposerEntry) => {
    setComposer(item.composer); setShowComposerSuggestions(false); setTitle("");
  }, []);

  const selectTitle = useCallback((work: string) => {
    const match = work.match(/^(.+) \((.+)\)$/);
    if (match) { setTitle(match[1]); setComposer(match[2]); } else { setTitle(work); }
    setShowTitleSuggestions(false);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(e.target as Node)) setShowComposerSuggestions(false);
      if (titleRef.current && !titleRef.current.contains(e.target as Node)) setShowTitleSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const requestNotification = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    return (await Notification.requestPermission()) === "granted";
  }, []);

  // 폴링 시작 (에러 카운트 + cleanup 지원)
  const startPolling = useCallback((jobId: string, comp: string, ttl: string) => {
    let errorCount = 0;
    const MAX_ERRORS = 10;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analyze-song-v2/status?job_id=${jobId}`);
        const data: JobStatusResponse = await res.json();

        if (data.status === "done" && data.result_id) {
          clearInterval(interval);
          // 보관함에 추가
          addUserAnalysis({ id: data.result_id, composer: comp, title: ttl });
          sendAnalysisCompleteNotification(comp, ttl, data.result_id);
          // 결과 페이지로 자동 이동 (탭이 열려있으면)
          router.push(`/ai-analysis/${data.result_id}`);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setAnalyzeError(data.error_message ?? "분석에 실패했습니다.");
          setAnalysisStarted(false);
        }
        errorCount = 0; // 성공 시 리셋
      } catch {
        errorCount++;
        if (errorCount >= MAX_ERRORS) {
          clearInterval(interval);
          setAnalyzeError("서버 연결이 불안정합니다. 잠시 후 AI 분석 페이지에서 확인해주세요.");
        }
      }
    }, 3000);

    pollingRef.current = interval;

    // 10분 타임아웃
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setAnalyzeError("분석 시간이 초과되었습니다. AI 분석 페이지에서 결과를 확인해주세요.");
      setAnalysisStarted(false);
    }, 10 * 60 * 1000);

    pollingTimeoutRef.current = timeout;
  }, [router]);

  const handleAnalyze = async () => {
    if (!title || !composer) return;
    setIsAnalyzing(true);
    setAnalyzeError("");

    const hasPermission = await requestNotification();
    setNotificationGranted(hasPermission);

    try {
      const res = await fetch("/api/analyze-song-v2/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ composer, title, instrument: getUserInstrument() }),
      });

      const result: AnalysisStartResponse = await res.json();

      if (!result.success) {
        setAnalyzeError(result.error || "분석 시작에 실패했습니다.");
        setIsAnalyzing(false);
        return;
      }

      // 캐시 히트 → 바로 이동
      if (result.cached && result.result_id) {
        addUserAnalysis({ id: result.result_id, composer, title });
        router.push(`/ai-analysis/${result.result_id}`);
        return;
      }

      // 새 분석 → 폴링
      if (result.job_id) {
        setActiveJobId(result.job_id);
        setAnalysisStarted(true);
        setIsAnalyzing(false);
        startPolling(result.job_id, composer, title);
      }
    } catch {
      setAnalyzeError("네트워크 오류가 발생했습니다.");
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = title.trim() && composer.trim();

  // ── 분석 진행 중 화면 ──
  if (analysisStarted && activeJobId) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
        <div className="bg-blob-extra" />
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => safeBack(router)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">분석 시작됨</h1>
            <p className="text-xs text-muted-foreground">백그라운드에서 진행 중</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{composer}</p>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            AI가 분석 중입니다. 1~2분 소요됩니다.
            <strong className="text-foreground"> 완료되면 자동으로 결과 페이지로 이동합니다.</strong>
          </p>
        </div>

        <div className={`rounded-2xl border p-4 mb-4 ${notificationGranted ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-center gap-3">
            {notificationGranted ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-800">완료 시 <strong>알림</strong>을 보내드립니다.</p>
              </>
            ) : (
              <>
                <Bell className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm text-amber-800">알림을 허용하면 다른 페이지에서도 완료를 알려드립니다.</p>
                  <button onClick={async () => setNotificationGranted(await requestNotification())} className="text-xs text-amber-700 underline mt-1">
                    알림 허용하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {analyzeError && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-4 mb-4">
            <p className="text-sm text-red-700">{analyzeError}</p>
          </div>
        )}

        <button
          onClick={() => {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
            setAnalysisStarted(false); setActiveJobId(null); setTitle(""); setComposer(""); setAnalyzeError("");
          }}
          className="w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary/50 transition-colors"
        >
          다른 곡 분석하기
        </button>
      </div>
    );
  }

  // ── 입력 화면 ──
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => safeBack(router)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">새 곡 분석</h1>
          <p className="text-xs text-muted-foreground">곡 정보를 입력하세요</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="relative" ref={composerRef}>
          <label className="text-sm font-medium text-foreground mb-1.5 block">작곡가 *</label>
          <input type="text" placeholder="예: Chopin, Bach, Mozart" value={composer}
            onChange={(e) => { setComposer(e.target.value); filterComposers(e.target.value); }}
            onFocus={() => { if (composer.length >= 2) filterComposers(composer); }}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <p className="text-xs text-muted-foreground mt-1">2글자 이상 입력하면 자동완성됩니다</p>
          {showComposerSuggestions && composerSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
              {composerSuggestions.map((item, i) => (
                <button key={`${item.composer}-${i}`} onClick={() => selectComposer(item)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 text-left">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{item.composer}</p>
                    <p className="text-xs text-muted-foreground">{item.fullName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={titleRef}>
          <label className="text-sm font-medium text-foreground mb-1.5 block">곡 제목 *</label>
          <input type="text" placeholder={composer ? `${composer}의 곡 검색...` : "예: Ballade, Sonata, Nocturne"} value={title}
            onChange={(e) => { setTitle(e.target.value); filterTitles(e.target.value); }}
            onFocus={() => { if (title.length >= 2) filterTitles(title); }}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          {showTitleSuggestions && titleSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
              {titleSuggestions.map((work, i) => (
                <button key={`${work}-${i}`} onClick={() => selectTitle(work)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 text-left">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0"><Music className="w-4 h-4 text-violet-600" /></div>
                  <p className="font-medium text-foreground text-sm truncate">{work}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />AI가 분석하는 항목
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[["곡 배경", "작곡 시기, 헌정, 초연 정보"], ["작곡가 설명", "생애, 음악적 특징"],
            ["시대적 맥락", "음악사적 위치, 영향"], ["형식·주제·동기", "구조 분석"],
            ["화성 진행", "로마숫자 분석"], ["연습 포인트", "템포, 페달, 프레이징 제안"],
            ["참고 자료", "관련 논문, 레퍼런스 링크"]].map(([label, desc]) => (
            <li key={label} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span><strong className="text-foreground">{label}</strong> - {desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
        <p className="text-sm text-amber-800"><strong>정확성 안내:</strong> AI는 검증된 음악학 자료를 바탕으로 분석합니다.</p>
      </div>

      {analyzeError && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 mb-4">
          <p className="text-sm text-red-700">{analyzeError}</p>
        </div>
      )}

      <button onClick={handleAnalyze} disabled={!canAnalyze || isAnalyzing}
        className="w-full py-4 rounded-xl bg-primary text-white font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {isAnalyzing ? (<><Loader2 className="w-5 h-5 animate-spin" />분석 시작 중...</>) : (<><Brain className="w-5 h-5" />AI 분석 시작</>)}
      </button>

      {!isAnalyzing && <p className="text-xs text-center text-gray-400 mt-2">분석 시작 후 다른 페이지로 이동해도 됩니다</p>}
    </div>
  );
}
