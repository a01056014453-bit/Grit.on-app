"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import { ArrowLeft, Brain, Loader2, Bell, CheckCircle2 } from "lucide-react";
import { ComposerAutocomplete, TitleAutocomplete } from "@/components/ui/composer-autocomplete";
import { addUserAnalysis } from "@/lib/user-analyses";
import { createBrowserClient } from "@supabase/ssr";

// ── 타입 정의 ──

interface AnalysisStartResponse {
  success: boolean;
  error?: string;
  cached?: boolean;
  result_id?: string;
  job_id?: string;
  message?: string;
}

interface JobStatusResponse {
  success: boolean;
  status: "processing" | "done" | "failed";
  result_id?: string;
  error_message?: string;
}

// ── 유틸 ──

function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

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

async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
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
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if ("Notification" in window) setNotificationGranted(Notification.permission === "granted");
  }, []);

  // 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, []);

  // 완료 콜백 통합
  const handleAnalysisComplete = useCallback((resultId: string, comp: string, ttl: string) => {
    sendAnalysisCompleteNotification(comp, ttl, resultId);
    addUserAnalysis({ id: resultId, composer: comp, title: ttl });
    router.push(`/ai-analysis/${resultId}`);
  }, [router]);

  // 폴링 시작
  const startPolling = useCallback((jobId: string, comp: string, ttl: string) => {
    let errorCount = 0;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analyze-song-v2/status?job_id=${jobId}`);
        const data: JobStatusResponse = await res.json();

        if (data.status === "done" && data.result_id) {
          clearInterval(interval);
          handleAnalysisComplete(data.result_id, comp, ttl);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setAnalyzeError(data.error_message ?? "분석에 실패했습니다.");
          setAnalysisStarted(false);
        }
        errorCount = 0;
      } catch {
        errorCount++;
        if (errorCount >= 10) {
          clearInterval(interval);
          setAnalyzeError("서버 연결이 불안정합니다. AI 분석 페이지에서 확인해주세요.");
        }
      }
    }, 3000);

    pollingRef.current = interval;
    pollingTimeoutRef.current = setTimeout(() => {
      clearInterval(interval);
      setAnalyzeError("분석 시간이 초과되었습니다.");
      setAnalysisStarted(false);
    }, 10 * 60 * 1000);
  }, [handleAnalysisComplete]);

  const handleAnalyze = async () => {
    if (!title || !composer) return;
    setIsAnalyzing(true);
    setAnalyzeError("");

    const hasPermission = await requestNotificationPermission();
    setNotificationGranted(hasPermission);

    try {
      // Supabase 세션에서 토큰 가져오기
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const res = await fetch("/api/analyze-song-v2/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
                <p className="text-sm text-green-800">완료 시 <strong>알림</strong>을 보내드립니다. 자동으로 이동합니다.</p>
              </>
            ) : (
              <>
                <Bell className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm text-amber-800">이 탭이 열려있으면 완료 시 자동 이동합니다. 다른 앱에서도 알림을 받으려면:</p>
                  <button onClick={async () => setNotificationGranted(await requestNotificationPermission())} className="text-xs text-amber-700 underline mt-1">
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
        <ComposerAutocomplete
          value={composer}
          onChange={(v) => { setComposer(v); setTitle(""); }}
          label="작곡가 *"
          placeholder="예: Chopin, Bach, Mozart"
        />
        <TitleAutocomplete
          value={title}
          onChange={setTitle}
          composer={composer}
          label="곡 제목 *"
        />
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
