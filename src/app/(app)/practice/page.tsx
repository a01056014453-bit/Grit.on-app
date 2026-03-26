"use client";

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DrillCard } from "@/types";
import { useAudioRecorder, usePracticeSessions } from "@/hooks";
import { savePracticeSession, getAllSessions, deleteSession, type PracticeSession } from "@/lib/db";
import { syncPracticeSessions } from "@/lib/sync-practice";
import { pushUserDataDebounced } from "@/lib/sync-user-data";
import { completePracticeTodo } from "@/lib/practice-todo-store";
import { addNotification } from "@/lib/notification-store";
import { formatTime } from "@/lib/format";
import { getUserSongs, getDrillCards } from "@/lib/queries";
import { ComposerAutocomplete, TitleAutocomplete } from "@/components/ui/composer-autocomplete";
import { groupDrillsBySong } from "@/lib/utils-practice";
import { getUserId } from "@/lib/user-id";
import { setPracticeRecording } from "@/hooks/usePracticeGuard";
import {
  buildSessionsForDate,
  buildCalendarData,
  buildScheduledDays,
  buildPiecesForDate,
  formatDateStr as drillFormatDateStr,
  saveScheduledDrillIds,
  loadScheduledDrillIds,
  loadCompletedDrills,
  loadCustomDrills,
  getAllAvailableDrills,
} from "@/lib/drill-records";
import type { PracticeType, Song, PracticeTodo } from "@/types";
import Link from "next/link";
import { Music2, ChevronRight, ChevronLeft, Plus, Check, X, Clock, RotateCcw, Repeat, ArrowRight, Trash2, Calendar, Mic, Music, Square } from "lucide-react";
import {
  PracticeTimer,
  SongSelectionModal,
  AddSongModal,
  PracticeAnalysisModal,
  TodayDrillList,
  ScheduleModal,
} from "@/components/practice";
import { AlertCircle, MonitorOff } from "lucide-react";
import { fetchAudioUrlsForDate } from "@/lib/audio-storage";
import { type MetronomeState } from "@/components/practice/metronome-control";
import type { AnalysisResult } from "@/app/api/analyze-practice/route";

interface CompletedSession {
  totalTime: number;
  practiceTime: number;
  practiceType: PracticeType;
  startTime?: Date;
  endTime?: Date;
}

interface RecordedAudio {
  url: string;
  duration: number;
}

interface Drill {
  id: string;
  song: string;
  measures: string;
  title: string;
  mode: "duration" | "recurrence";
  duration: number;
  recurrence: number;
}

interface Routine {
  id: string;
  name: string;
  drills: Drill[];
  days: number[]; // 0=일, 1=월, ... 6=토, empty=매일
  createdAt: string;
}

interface DailyCompletion {
  date: string; // YYYY-MM-DD
  completedDrillIds: string[];
}

function formatRelativeDate(d: Date): string {
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}달 전`;
}

// ─── 타임라인 재생 가능 세션 ────────────────────────────────────────────────

function PlayableTimelineSession({ session }: { session: import("@/lib/drill-records").RecordSession }) {
  const router = useRouter();
  const canPlay = !!session.audioBlob || !!session.audioUrl;

  const handleClick = () => {
    if (canPlay && session.dbId != null) {
      router.push(`/practice/recording/${session.dbId}`);
    }
  };

  return (
    <div className="flex items-start gap-3 mb-3 relative">
      <div className="w-2 h-2 rounded-full bg-violet-400/60 mt-2.5 shrink-0 relative z-10" />
      <div
        onClick={handleClick}
        className={`flex-1 rounded-xl px-3.5 py-2.5 ${canPlay ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}`}
        style={{
          background: "rgba(255,255,255,0.35)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.4)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-gray-800 truncate">
            {session.piece}
          </span>
          {session.hasRecording && (
            <span
              className="text-[11px] font-medium text-green-600 px-1.5 py-0.5 rounded-md shrink-0 ml-2"
              style={{ background: "rgba(34,197,94,0.15)" }}
            >
              녹음
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {session.detail && <span className="text-[12px] text-gray-400">{session.detail}</span>}
          {session.detail && session.duration && <span className="text-[12px] text-gray-400">·</span>}
          {session.duration && (
            <span className="text-[12px] text-gray-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {session.duration}
            </span>
          )}
        </div>
        <span className="text-[11px] text-violet-400 mt-1 block">{session.time}</span>
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
        <div className="bg-blob-extra" />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <PracticePageContent />
    </Suspense>
  );
}

function PracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 공유 훅으로 세션 데이터 로드 (홈 페이지와 동일 데이터 소스)
  const { sessions: recentSessions, sessionsByDate: calSessionsByDate, reload: reloadSessions } = usePracticeSessions();
  const [activeDrill, setActiveDrill] = useState<DrillCard | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [practiceType, setPracticeType] = useState<PracticeType>("runthrough");
  const [songs, setSongs] = useState<Song[]>([]);
  const [dbDrillCards, setDbDrillCards] = useState<DrillCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newSong, setNewSong] = useState({ composer: "", title: "" });
  const [completedSession, setCompletedSession] = useState<CompletedSession | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPausedMessage, setAutoPausedMessage] = useState<string | null>(null);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  // recentSessions is now from usePracticeSessions hook
  const [measureRange, setMeasureRange] = useState<{ start: number; end: number } | null>(null);
  const [dailyGoal] = useState(60); // 일일 목표 (분)
  const [selectedTodo, setSelectedTodo] = useState<PracticeTodo | null>(null);
  const [completedDrills, setCompletedDrills] = useState<Set<string>>(new Set());
  const [isAddDrillModalOpen, setIsAddDrillModalOpen] = useState(false);
  const [customDrills, setCustomDrills] = useState<Array<{
    id: string;
    song: string;
    measures: string;
    title: string;
    mode: "duration" | "recurrence";
    duration: number;
    recurrence: number;
  }>>([]);
  const [newDrill, setNewDrill] = useState({
    selectedSong: "", // 기존 곡 선택
    isNewSong: false, // 새 곡 추가 모드
    composer: "",
    songTitle: "",
    measures: "",
    title: "",
    mode: "duration" as "duration" | "recurrence",
    duration: 5,
    recurrence: 3,
  });
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [carryOverDrills, setCarryOverDrills] = useState<Drill[]>([]);
  const [showCarryOver, setShowCarryOver] = useState(true);
  const [newRoutine, setNewRoutine] = useState({
    name: "",
    days: [] as number[],
    drills: [] as Drill[],
  });
  const [routineDrill, setRoutineDrill] = useState({
    selectedSong: "",
    isNewSong: false,
    composer: "",
    songTitle: "",
    measures: "",
    title: "",
    mode: "duration" as "duration" | "recurrence",
    duration: 5,
    recurrence: 3,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 실시간 분류 시간 추적
  const classificationTimeRef = useRef({
    instrument: 0,
    voice: 0,
    silence: 0,
    noise: 0,
    lastLabel: null as string | null,
    lastUpdateTime: 0,
  });

  // Metronome state
  const [metronomeState, setMetronomeState] = useState<MetronomeState>({
    isPlaying: false,
    tempo: 120,
    timeSignature: "4/4",
    subdivision: "1",
  });
  const metronomeIsPlaying = metronomeState.isPlaying;

  const groupedDrills = groupDrillsBySong(dbDrillCards);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const wasRecordingBeforeHiddenRef = useRef(false);

  // Audio recorder hook with metronome-aware detection
  const {
    isRecording,
    isPaused,
    hasPermission,
    error,
    totalTime,
    practiceTime,
    currentVolume,
    currentDecibel,
    isSoundDetected,
    isPianoDetected,
    audioBlob,
    noiseFloor,
    isCalibrating,
    calibrationCountdown,
    audioLabel,
    classificationConfidence,
    frequencyBands,
    modelStatus,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
    runPostAnalysis,
  } = useAudioRecorder({
    decibelThreshold: 40,
    minSoundDuration: 100,
    calibrationDuration: 800,
    metronomeActive: metronomeIsPlaying,
  });

  // 실시간 분류 데이터 추적
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const now = Date.now();
    const ref = classificationTimeRef.current;

    // 이전 레이블의 시간 누적
    if (ref.lastLabel && ref.lastUpdateTime > 0) {
      const elapsed = (now - ref.lastUpdateTime) / 1000; // seconds
      if (ref.lastLabel === "INSTRUMENT_PLAYING") {
        ref.instrument += elapsed;
      } else if (ref.lastLabel === "VOICE") {
        ref.voice += elapsed;
      } else if (ref.lastLabel === "SILENCE") {
        ref.silence += elapsed;
      } else if (ref.lastLabel === "NOISE" || ref.lastLabel === "METRONOME_ONLY") {
        ref.noise += elapsed;
      }
    }

    // 현재 레이블 저장
    ref.lastLabel = audioLabel;
    ref.lastUpdateTime = now;
  }, [isRecording, isPaused, audioLabel]);

  // loadRecentSessions -> reloadSessions from shared hook
  const loadRecentSessions = reloadSessions;

  // Helper: Get today's date string (YYYY-MM-DD)
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Helper: Get yesterday's date string
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    setWakeLockSupported("wakeLock" in navigator);
    loadRecentSessions();

    const savedDrills = localStorage.getItem("grit-on-custom-drills");
    if (savedDrills) {
      setCustomDrills(JSON.parse(savedDrills));
    }

    const savedRoutines = localStorage.getItem("grit-on-routines");
    if (savedRoutines) {
      setRoutines(JSON.parse(savedRoutines));
    }

    const todayStr = getTodayStr();
    const todayCompletion = localStorage.getItem(`grit-on-completed-${todayStr}`);
    if (todayCompletion) {
      const data = JSON.parse(todayCompletion);
      setCompletedDrills(new Set(data.completedDrillIds || []));
    }

    // 어제 미완료 드릴만 carryOver 표시
    // - 이미 carry된 드릴은 제외 (무한 누적 방지)
    // - 오늘도 여전히 존재하는 상시 드릴은 제외 (매일 반복 표시 방지)
    const yesterdayStr = getYesterdayStr();
    const yesterdayCompletion = localStorage.getItem(`grit-on-completed-${yesterdayStr}`);
    const yesterdayDrills = localStorage.getItem(`grit-on-drills-${yesterdayStr}`);

    if (yesterdayDrills) {
      const allYesterdayDrills: Drill[] = JSON.parse(yesterdayDrills);
      const completedIds = yesterdayCompletion
        ? new Set(JSON.parse(yesterdayCompletion).completedDrillIds || [])
        : new Set();

      // 오늘 customDrills에 있는 상시 드릴 ID 수집
      const todayDrillIds = new Set(
        savedDrills ? (JSON.parse(savedDrills) as { id: string }[]).map(d => d.id) : []
      );

      const incomplete = allYesterdayDrills.filter(
        d => !completedIds.has(d.id)
          && !d.id.startsWith("carryover-")
          && !todayDrillIds.has(d.id) // 오늘도 있는 상시 드릴은 carry-over 불필요
      );
      if (incomplete.length > 0) {
        const dismissedCarryOver = localStorage.getItem(`grit-on-carryover-dismissed-${todayStr}`);
        if (!dismissedCarryOver) {
          setCarryOverDrills(incomplete);
        }
      }
    }

    const loadRemoteData = async () => {
      const userId = getUserId();
      if (!userId) return;
      try {
        const [fetchedSongs, fetchedCards] = await Promise.all([
          getUserSongs(userId),
          getDrillCards(userId),
        ]);

        // 연습 기록(IndexedDB)과 커스텀 드릴에서 곡 이름 수집
        const allSessions = await getAllSessions();
        const localSongNames = new Set<string>();
        allSessions.forEach((s) => {
          if (s.pieceName) localSongNames.add(s.pieceName);
        });
        const savedCustom = localStorage.getItem("grit-on-custom-drills");
        if (savedCustom) {
          try {
            const customs = JSON.parse(savedCustom);
            customs.forEach((d: { song?: string }) => {
              if (d.song) localSongNames.add(d.song);
            });
          } catch {}
        }

        // Supabase songs에 없는 곡을 로컬 Song으로 추가
        const existingTitles = new Set(fetchedSongs.map((s) => s.title));
        const localSongs: Song[] = [];
        localSongNames.forEach((name) => {
          if (!existingTitles.has(name)) {
            // 가장 최근 세션의 시간 찾기
            const lastSession = allSessions
              .filter((s) => s.pieceName === name)
              .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
            const lastPracticed = lastSession
              ? formatRelativeDate(new Date(lastSession.startTime))
              : "";
            localSongs.push({
              id: `local-${name}`,
              title: name,
              duration: "",
              lastPracticed,
            });
          }
        });

        setSongs([...fetchedSongs, ...localSongs]);
        setDbDrillCards(fetchedCards);
      } catch (err) {
        console.error("Failed to load songs / drill cards:", err);
      }
    };
    loadRemoteData();
  }, [loadRecentSessions]);

  // URL 파라미터로 전달된 drill 로드
  useEffect(() => {
    const drillId = searchParams.get("drill");
    if (drillId) {
      // localStorage에서 활성 드릴 정보 가져오기
      const savedDrill = localStorage.getItem("grit-on-active-drill");
      if (savedDrill) {
        const drill: DrillCard = JSON.parse(savedDrill);
        setActiveDrill(drill);

        // 곡 설정
        const matchedSong = songs.find(s => s.title.includes(drill.song) || drill.song.includes(s.title));
        if (matchedSong) {
          setSelectedSong(matchedSong);
        } else {
          // 새 곡으로 설정
          const newSongData: Song = {
            id: `drill-song-${Date.now()}`,
            title: drill.song,
            duration: "5 min",
            lastPracticed: "New",
          };
          setSelectedSong(newSongData);
        }

        // 마디 범위 파싱 (예: "23-26마디" -> { start: 23, end: 26 })
        const measureMatch = drill.measures.match(/(\d+)-(\d+)/);
        if (measureMatch) {
          setMeasureRange({
            start: parseInt(measureMatch[1]),
            end: parseInt(measureMatch[2]),
          });
        }

        // 메트로놈 템포 설정
        if (drill.tempo > 0) {
          setMetronomeState(prev => ({ ...prev, tempo: drill.tempo }));
        }

        // 사용 후 localStorage에서 제거
        localStorage.removeItem("grit-on-active-drill");
      }
    }
  }, [searchParams, songs]);

  useEffect(() => {
    if (hasPermission === null) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Wake Lock: Keep screen on during recording
  const requestWakeLock = useCallback(async () => {
    if (!wakeLockSupported) return;

    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      console.log("Wake Lock activated");

      wakeLockRef.current.addEventListener("release", () => {
        console.log("Wake Lock released");
      });
    } catch (err) {
      console.log("Wake Lock failed:", err);
    }
  }, [wakeLockSupported]);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  // Page visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden (user switched tab, minimized, etc.)
        if (isRecording && !isPaused) {
          wasRecordingBeforeHiddenRef.current = true;
          pauseRecording();
          setAutoPausedMessage("화면 이탈로 연습이 자동 일시정지되었습니다");
        }
      } else {
        // Page is visible again
        // Re-request wake lock when page becomes visible
        if (isRecording) {
          requestWakeLock();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRecording, isPaused, pauseRecording, requestWakeLock]);

  // Warn before page unload during recording
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecording) {
        e.preventDefault();
        e.returnValue = "연습 중입니다. 페이지를 나가면 녹음이 중단됩니다.";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isRecording]);

  // 전역 연습 상태 동기화 (BottomNavigation 연동)
  useEffect(() => {
    setPracticeRecording(isRecording);
    return () => setPracticeRecording(false);
  }, [isRecording]);

  // Manage wake lock based on recording state
  useEffect(() => {
    if (isRecording && !isPaused) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isRecording, isPaused, requestWakeLock, releaseWakeLock]);

  const handleStartRecording = useCallback(async () => {
    // 곡이 선택되지 않았으면 곡 선택 모달 열기
    if (!selectedSong && !activeDrill) {
      setIsSongModalOpen(true);
      return;
    }
    // 분류 데이터 리셋
    classificationTimeRef.current = {
      instrument: 0,
      voice: 0,
      silence: 0,
      noise: 0,
      lastLabel: null,
      lastUpdateTime: 0,
    };
    setSessionStartTime(new Date());
    setAutoPausedMessage(null);
    await startRecording();
  }, [startRecording, selectedSong, activeDrill]);

  const handleResumeRecording = useCallback(() => {
    setAutoPausedMessage(null);
    wasRecordingBeforeHiddenRef.current = false;
    resumeRecording();
  }, [resumeRecording]);

  // Handle metronome state change
  const handleMetronomeStateChange = useCallback((newState: MetronomeState) => {
    setMetronomeState(newState);
  }, []);

  // 사후 분석 실패 시 간이 결과 생성
  const createFallbackAnalysis = (ref: typeof classificationTimeRef.current, totalTime: number): AnalysisResult => {
    const total = ref.instrument + ref.voice + ref.silence + ref.noise;
    const effective = totalTime > 0 ? totalTime : total;
    return {
      totalDuration: effective,
      netPracticeTime: Math.round(ref.instrument),
      restTime: effective - Math.round(ref.instrument),
      segments: [],
      summary: {
        instrumentPercent: effective > 0 ? Math.round((ref.instrument / effective) * 100) : 0,
        voicePercent: effective > 0 ? Math.round((ref.voice / effective) * 100) : 0,
        silencePercent: effective > 0 ? Math.round((ref.silence / effective) * 100) : 0,
        noisePercent: effective > 0 ? Math.round((ref.noise / effective) * 100) : 0,
      },
    };
  };

  const handleStopRecording = useCallback(async () => {
    stopRecording();
    releaseWakeLock();
    setAutoPausedMessage(null);

    // 마지막 분류 시간 누적
    const ref = classificationTimeRef.current;
    const now = Date.now();
    if (ref.lastLabel && ref.lastUpdateTime > 0) {
      const elapsed = (now - ref.lastUpdateTime) / 1000;
      if (ref.lastLabel === "INSTRUMENT_PLAYING") {
        ref.instrument += elapsed;
      } else if (ref.lastLabel === "VOICE") {
        ref.voice += elapsed;
      } else if (ref.lastLabel === "SILENCE") {
        ref.silence += elapsed;
      } else if (ref.lastLabel === "NOISE" || ref.lastLabel === "METRONOME_ONLY") {
        ref.noise += elapsed;
      }
    }

    // 세션 정보 저장
    const sessionEnd = new Date();
    const actualTotalTime = totalTime > 0 ? totalTime : 0;

    setCompletedSession({
      totalTime: actualTotalTime,
      practiceTime: 0, // 분석 후 업데이트
      practiceType,
      startTime: sessionStartTime || undefined,
      endTime: sessionEnd,
    });

    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      setRecordedAudio({ url: audioUrl, duration: actualTotalTime });
    }

    // 분석 모달 열기
    setIsAnalysisModalOpen(true);
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    let analysisData: AnalysisResult;

    // 사후 분석: 녹음 파일을 YAMNet으로 정밀 분석
    if (audioBlob) {
      try {
        const postResult = await runPostAnalysis((percent) => {
          setAnalysisProgress(percent);
        });

        if (postResult) {
          const effectiveTotalTime = postResult.totalDuration || actualTotalTime;
          analysisData = {
            totalDuration: effectiveTotalTime,
            netPracticeTime: postResult.practiceTime,
            restTime: postResult.restTime + postResult.noiseTime,
            segments: [],
            summary: {
              instrumentPercent: postResult.focusPercent,
              voicePercent: effectiveTotalTime > 0 ? Math.round((postResult.voiceTime / effectiveTotalTime) * 100) : 0,
              silencePercent: effectiveTotalTime > 0 ? Math.round((postResult.restTime / effectiveTotalTime) * 100) : 0,
              noisePercent: effectiveTotalTime > 0 ? Math.round((postResult.noiseTime / effectiveTotalTime) * 100) : 0,
            },
          };
        } else {
          // 분석 실패 시 간이 결과 사용
          analysisData = createFallbackAnalysis(ref, actualTotalTime);
        }
      } catch (err) {
        console.error("[PostAnalysis] 사후 분석 실패:", err);
        analysisData = createFallbackAnalysis(ref, actualTotalTime);
      }
    } else {
      // 녹음 파일 없으면 간이 결과
      analysisData = createFallbackAnalysis(ref, actualTotalTime);
    }

    setAnalysisResult(analysisData);
    setCompletedSession(prev => prev ? {
      ...prev,
      practiceTime: analysisData.netPracticeTime,
    } : null);

    // 분류 데이터 리셋
    classificationTimeRef.current = {
      instrument: 0,
      voice: 0,
      silence: 0,
      noise: 0,
      lastLabel: null,
      lastUpdateTime: 0,
    };

    setIsAnalyzing(false);
  }, [
    stopRecording,
    releaseWakeLock,
    sessionStartTime,
    totalTime,
    audioBlob,
    practiceType,
    metronomeIsPlaying,
  ]);

  // 분석 결과 저장
  const handleSaveAnalysis = useCallback(async () => {
    if (sessionStartTime && completedSession && analysisResult) {
      // To-do 메모 생성 (마디 범위 + 노트)
      const todoNote = selectedTodo
        ? selectedTodo.measureStart > 0 && selectedTodo.measureEnd > 0
          ? `${selectedTodo.measureStart}-${selectedTodo.measureEnd}마디${selectedTodo.note ? ` · ${selectedTodo.note}` : ""}`
          : selectedTodo.note || undefined
        : activeDrill
          ? `${activeDrill.measures} · ${activeDrill.title}`
          : undefined;

      const session = {
        pieceId: selectedSong?.id || "unknown",
        pieceName: activeDrill ? activeDrill.song : (selectedSong?.title || "미지정 곡"),
        startTime: sessionStartTime,
        endTime: completedSession.endTime || new Date(),
        totalTime: analysisResult.totalDuration,
        practiceTime: analysisResult.netPracticeTime, // 순수 연습 시간만 저장
        audioBlob: audioBlob || undefined,
        synced: false,
        practiceType: completedSession.practiceType,
        label: "연습",
        measureRange: measureRange, // 집중 타겟 마디
        todoNote, // To-do 메모
      };

      try {
        await savePracticeSession(session);
        // Sync to Supabase (non-blocking, failure won't affect local save)
        syncPracticeSessions().catch(console.error);
        await loadRecentSessions();

        // 연습 마일스톤 알림 (30분 이상 연습 시)
        const practiceMinutes = Math.round(session.practiceTime / 60);
        if (practiceMinutes >= 30) {
          addNotification({
            type: "practice_milestone",
            title: `${practiceMinutes}분 연습 완료!`,
            description: `${session.pieceName} 연습을 마쳤습니다. 꾸준한 연습이 실력을 만들어요!`,
            icon: "Trophy",
            actionUrl: "/stats",
          });
        }

        // 선택된 To-do가 있으면 완료 처리
        if (selectedTodo) {
          completePracticeTodo(selectedTodo.id);
          setSelectedTodo(null);
        }

        // 활성 드릴이 있으면 자동 완료 처리
        if (activeDrill) {
          const todayStr = getTodayStr();
          const savedCompleted = localStorage.getItem(`grit-on-completed-${todayStr}`);
          const completedIds = savedCompleted
            ? new Set(JSON.parse(savedCompleted).completedDrillIds || [])
            : new Set<string>();
          completedIds.add(activeDrill.id);
          const completedKey1 = `grit-on-completed-${todayStr}`;
          localStorage.setItem(completedKey1, JSON.stringify({
            date: todayStr,
            completedDrillIds: Array.from(completedIds),
          }));
          pushUserDataDebounced(completedKey1);
          setCompletedDrills(completedIds as Set<string>);
          setActiveDrill(null);
        }
      } catch (err) {
        console.error("Failed to save session:", err);
      }
    }

    handleCloseAnalysisModal();
  }, [sessionStartTime, completedSession, analysisResult, selectedSong, audioBlob, measureRange, loadRecentSessions, selectedTodo, activeDrill]);

  // 분석 모달 닫기 (저장 안함)
  const handleDiscardAnalysis = useCallback(() => {
    handleCloseAnalysisModal();
  }, []);

  // 분석 모달 닫기 공통
  const handleCloseAnalysisModal = useCallback(() => {
    setIsAnalysisModalOpen(false);
    setAnalysisResult(null);
    setCompletedSession(null);
    setSessionStartTime(null); // 시작 시간 리셋
    setSelectedTodo(null); // To-do 선택 해제
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url);
      setRecordedAudio(null);
    }
    reset();
  }, [recordedAudio, reset]);

  const handlePlayRecording = () => {
    if (!recordedAudio) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };


  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setIsSongModalOpen(false);
  };

  // To-do 선택 시 곡과 마디 설정
  const handleTodoSelect = useCallback((todo: PracticeTodo) => {
    setSelectedTodo(todo);
    // 해당 곡으로 설정
    const matchedSong = songs.find(s => s.title.includes(todo.songTitle) || todo.songTitle.includes(s.title));
    if (matchedSong) {
      setSelectedSong(matchedSong);
    } else {
      // 곡이 없으면 새로 생성
      const newSong: Song = {
        id: todo.songId,
        title: todo.songTitle,
        duration: "5 min",
        lastPracticed: "New",
      };
      setSelectedSong(newSong);
    }
    // 마디 범위 설정
    setMeasureRange({ start: todo.measureStart, end: todo.measureEnd });
  }, [songs]);

  const handleAddSong = () => {
    if (newSong.composer.trim().length < 2 || newSong.title.trim().length < 2) return;

    const newSongData: Song = {
      id: String(songs.length + 1),
      title: `${newSong.composer.trim()} ${newSong.title.trim()}`,
      duration: "5 min",
      lastPracticed: "New",
    };

    setSongs([newSongData, ...songs]);
    setSelectedSong(newSongData);
    setNewSong({ composer: "", title: "" });
    setIsAddSongModalOpen(false);
    setIsSongModalOpen(false);
  };

  // Toggle drill completion
  const handleToggleDrill = (drillId: string) => {
    setCompletedDrills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(drillId)) {
        newSet.delete(drillId);
      } else {
        newSet.add(drillId);
      }
      // Save to localStorage with today's date
      const todayStr = getTodayStr();
      const completedKey2 = `grit-on-completed-${todayStr}`;
      localStorage.setItem(completedKey2, JSON.stringify({
        date: todayStr,
        completedDrillIds: Array.from(newSet),
      }));
      pushUserDataDebounced(completedKey2);
      return newSet;
    });
    setRefreshKey((k) => k + 1);
  };

  // Accept carry-over drills (add them to today's drills)
  const handleAcceptCarryOver = () => {
    const newCustomDrills = [
      ...customDrills,
      ...carryOverDrills.map(d => ({
        ...d,
        id: `carryover-${Date.now()}-${d.id}`, // New ID for today
      })),
    ];
    setCustomDrills(newCustomDrills);
    localStorage.setItem("grit-on-custom-drills", JSON.stringify(newCustomDrills));
    pushUserDataDebounced("grit-on-custom-drills");
    setCarryOverDrills([]);
    setShowCarryOver(false);
  };

  // Dismiss carry-over drills
  const handleDismissCarryOver = () => {
    const todayStr = getTodayStr();
    localStorage.setItem(`grit-on-carryover-dismissed-${todayStr}`, "true");
    setCarryOverDrills([]);
    setShowCarryOver(false);
  };

  // Save today's drills for carry-over checking tomorrow
  useEffect(() => {
    const todayStr = getTodayStr();
    const drillsToSave = customDrills.map(d => ({
      id: d.id,
      song: d.song,
      measures: d.measures,
      title: d.title,
      mode: d.mode,
      duration: d.duration,
      recurrence: d.recurrence,
    }));
    if (drillsToSave.length > 0) {
      localStorage.setItem(`grit-on-drills-${todayStr}`, JSON.stringify(drillsToSave));
    }

    // 7일 이전의 carry-over 관련 localStorage 키 정리
    try {
      const keysToCheck = Object.keys(localStorage);
      const drillKeyRegex = /^grit-on-(drills|completed|carryover-dismissed)-(\d{4}-\d{2}-\d{2})$/;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      for (const key of keysToCheck) {
        const match = key.match(drillKeyRegex);
        if (match) {
          const keyDate = new Date(match[2]);
          if (keyDate < sevenDaysAgo) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch {
      // localStorage 정리 실패 무시
    }
  }, [customDrills]);

  // Add routine drill
  const handleAddRoutineDrill = () => {
    let songName = "";
    if (routineDrill.isNewSong) {
      songName = routineDrill.composer.trim() && routineDrill.songTitle.trim()
        ? `${routineDrill.composer.trim()} ${routineDrill.songTitle.trim()}`
        : routineDrill.composer.trim() || routineDrill.songTitle.trim();
    } else {
      songName = routineDrill.selectedSong;
    }

    if (!songName || !routineDrill.measures.trim()) return;

    const drill: Drill = {
      id: `routine-drill-${Date.now()}`,
      song: songName,
      measures: routineDrill.measures.trim(),
      title: routineDrill.title.trim() || "연습",
      mode: routineDrill.mode,
      duration: routineDrill.mode === "duration" ? routineDrill.duration : 0,
      recurrence: routineDrill.mode === "recurrence" ? routineDrill.recurrence : 0,
    };

    setNewRoutine(prev => ({ ...prev, drills: [...prev.drills, drill] }));
    setRoutineDrill({
      selectedSong: "",
      isNewSong: false,
      composer: "",
      songTitle: "",
      measures: "",
      title: "",
      mode: "duration",
      duration: 5,
      recurrence: 3,
    });
  };

  // Save routine
  const handleSaveRoutine = () => {
    if (!newRoutine.name.trim() || newRoutine.drills.length === 0) return;

    const routine: Routine = {
      id: `routine-${Date.now()}`,
      name: newRoutine.name.trim(),
      drills: newRoutine.drills,
      days: newRoutine.days,
      createdAt: new Date().toISOString(),
    };

    const updatedRoutines = [...routines, routine];
    setRoutines(updatedRoutines);
    localStorage.setItem("grit-on-routines", JSON.stringify(updatedRoutines));
    pushUserDataDebounced("grit-on-routines");
    setNewRoutine({ name: "", days: [], drills: [] });
    setIsRoutineModalOpen(false);
  };

  // Delete routine
  const handleDeleteRoutine = (routineId: string) => {
    const updatedRoutines = routines.filter(r => r.id !== routineId);
    setRoutines(updatedRoutines);
    localStorage.setItem("grit-on-routines", JSON.stringify(updatedRoutines));
    pushUserDataDebounced("grit-on-routines");
  };

  // Apply routine to today's drills
  const handleApplyRoutine = (routine: Routine) => {
    const newDrills = routine.drills.map(d => ({
      ...d,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    const updatedDrills = [...customDrills, ...newDrills];
    setCustomDrills(updatedDrills);
    localStorage.setItem("grit-on-custom-drills", JSON.stringify(updatedDrills));
    pushUserDataDebounced("grit-on-custom-drills");
  };

  // Toggle routine day
  const handleToggleRoutineDay = (day: number) => {
    setNewRoutine(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort(),
    }));
  };

  // Get today's applicable routines
  const getTodayRoutines = () => {
    const dayOfWeek = new Date().getDay();
    return routines.filter(r =>
      r.days.length === 0 || r.days.includes(dayOfWeek)
    );
  };


  // Add new drill
  const handleAddDrill = () => {
    let songName = "";

    if (newDrill.isNewSong) {
      // 새 곡 추가 모드
      songName = newDrill.composer.trim() && newDrill.songTitle.trim()
        ? `${newDrill.composer.trim()} ${newDrill.songTitle.trim()}`
        : newDrill.composer.trim() || newDrill.songTitle.trim();
    } else {
      // 기존 곡 선택 모드
      songName = newDrill.selectedSong;
    }

    if (!songName || !newDrill.measures.trim()) return;

    const drill = {
      id: `custom-${Date.now()}`,
      song: songName,
      measures: newDrill.measures.trim(),
      title: newDrill.title.trim() || "연습",
      mode: newDrill.mode,
      duration: newDrill.mode === "duration" ? newDrill.duration : 0,
      recurrence: newDrill.mode === "recurrence" ? newDrill.recurrence : 0,
    };

    const updatedDrills = [...customDrills, drill];
    setCustomDrills(updatedDrills);
    localStorage.setItem("grit-on-custom-drills", JSON.stringify(updatedDrills));
    pushUserDataDebounced("grit-on-custom-drills");

    // 오늘 스케줄에 자동 등록
    const todayStr = drillFormatDateStr(new Date());
    const currentScheduled = loadScheduledDrillIds(todayStr);
    currentScheduled.add(drill.id);
    saveScheduledDrillIds(todayStr, Array.from(currentScheduled));

    setNewDrill({ selectedSong: "", isNewSong: false, composer: "", songTitle: "", measures: "", title: "", mode: "duration", duration: 5, recurrence: 3 });
    setIsAddDrillModalOpen(false);
  };

  // Delete custom drill
  const handleDeleteDrill = (drillId: string) => {
    const updatedDrills = customDrills.filter(d => d.id !== drillId);
    setCustomDrills(updatedDrills);
    localStorage.setItem("grit-on-custom-drills", JSON.stringify(updatedDrills));
    pushUserDataDebounced("grit-on-custom-drills");
  };

  // Get weekly practice data
  const getWeeklyData = () => {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    return dayNames.map((name, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const daySessions = recentSessions.filter((s) => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });

      const minutes = Math.floor(
        daySessions.reduce((sum, s) => sum + s.practiceTime, 0) / 60
      );

      return {
        name,
        date,
        minutes,
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
      };
    });
  };

  const weeklyData = getWeeklyData();

  // 연습 기록 달력
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calSelectedDate, setCalSelectedDate] = useState<Date>(new Date());
  const [calViewMode, setCalViewMode] = useState<"week" | "month">("week");

  // calSessionsByDate is now from usePracticeSessions hook

  const calSelectedSessions = useMemo(() => {
    const key = `${calSelectedDate.getFullYear()}-${String(calSelectedDate.getMonth() + 1).padStart(2, "0")}-${String(calSelectedDate.getDate()).padStart(2, "0")}`;
    return (calSessionsByDate[key] || []).sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [calSelectedDate, calSessionsByDate]);

  const calPracticeDays = useMemo(() => {
    const days = new Set<number>();
    recentSessions.forEach(s => {
      const d = new Date(s.startTime);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) days.add(d.getDate());
    });
    return days.size;
  }, [recentSessions, calMonth, calYear]);

  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calToday = new Date();
  const calDayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const calWeekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

  // 주간 뷰: 선택된 날짜가 포함된 주의 7일 (시간 제거하여 날짜만 비교)
  const calWeekDays = useMemo(() => {
    const start = new Date(calSelectedDate.getFullYear(), calSelectedDate.getMonth(), calSelectedDate.getDate());
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [calSelectedDate]);

  const totalDrillCount = dbDrillCards.length + customDrills.length;

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 클라이언트 마운트 후 localStorage 의존 데이터 렌더링 (hydration 불일치 방지)
  const [calMounted, setCalMounted] = useState(false);
  useEffect(() => setCalMounted(true), []);

  const recDateStr = drillFormatDateStr(calSelectedDate);
  const recSessionsRaw = useMemo(() => calMounted ? buildSessionsForDate(recDateStr, recentSessions) : [], [recDateStr, recentSessions, refreshKey, calMounted]);
  const scheduledDays = useMemo(() => calMounted ? buildScheduledDays(calYear, calMonth) : new Set<number>(), [calYear, calMonth, refreshKey, calMounted]);

  // 선택한 날짜의 미완료 투두 목록
  const selectedDateIncompleteDrills = useMemo(() => {
    if (!calMounted) return [];
    const scheduled = loadScheduledDrillIds(recDateStr);
    if (scheduled.size === 0) return [];
    const completed = loadCompletedDrills(recDateStr);
    const incompleteIds = [...scheduled].filter(id => !completed.has(id));
    if (incompleteIds.length === 0) return [];
    const allDrills = getAllAvailableDrills(dbDrillCards);
    return incompleteIds.map(id => allDrills.find(d => d.id === id)).filter(Boolean) as DrillCard[];
  }, [recDateStr, dbDrillCards, refreshKey, calMounted]);

  // 주간 뷰 날짜별 상태 (월 경계를 넘을 수 있으므로 별도 계산)
  const calWeekStatuses = useMemo(() => {
    if (!calMounted) return new Map<string, { status: "none" | "complete" | "incomplete"; hasSchedule: boolean; remainingCount: number }>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = new Map<string, { status: "none" | "complete" | "incomplete"; hasSchedule: boolean; remainingCount: number }>();
    for (const d of calWeekDays) {
      const key = drillFormatDateStr(d);
      const scheduled = loadScheduledDrillIds(key);
      const hasSchedule = scheduled.size > 0;
      if (d > today) { result.set(key, { status: "none", hasSchedule, remainingCount: 0 }); continue; }
      const completed = loadCompletedDrills(key);
      const sessionKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const count = calSessionsByDate[sessionKey]?.length || 0;
      const hasDrills = scheduled.size > 0 || count > 0;
      if (!hasDrills) { result.set(key, { status: "none", hasSchedule, remainingCount: 0 }); continue; }
      const remainingCount = [...scheduled].filter(id => !completed.has(id)).length;
      const allDone = scheduled.size > 0 ? remainingCount === 0 : true;
      result.set(key, { status: allDone ? "complete" : "incomplete", hasSchedule, remainingCount });
    }
    return result;
  }, [calWeekDays, calSessionsByDate, refreshKey, calMounted]);

  // Supabase 오디오 URL 로드
  const [recAudioUrlMap, setRecAudioUrlMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    if (calMounted) {
      fetchAudioUrlsForDate(recDateStr).then(setRecAudioUrlMap);
    }
  }, [recDateStr, calMounted]);

  // 로컬 Blob 없는 세션에 Supabase URL 머지
  const recSessions = useMemo(() => {
    if (recAudioUrlMap.size === 0) return recSessionsRaw;
    return recSessionsRaw.map((s) => {
      if (s.audioBlob) return s;
      const matchingSession = recentSessions.find(
        (sess) => drillFormatDateStr(new Date(sess.startTime)) === recDateStr && sess.pieceId === s.pieceId
      );
      if (matchingSession) {
        const isoKey = new Date(matchingSession.startTime).toISOString();
        const url = recAudioUrlMap.get(isoKey);
        if (url) return { ...s, hasRecording: true, audioUrl: url };
      }
      return s;
    });
  }, [recSessionsRaw, recAudioUrlMap, recentSessions, recDateStr]);

  const recTotalRecordings = recSessions.filter((s) => s.hasRecording).length;

  // 캘린더 날짜별 완료 상태 미리 계산 (렌더 중 localStorage 호출 방지)
  const calDayStatuses = useMemo(() => {
    if (!calMounted) return new Map<number, { status: "none" | "complete" | "incomplete"; remainingCount: number }>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const statuses = new Map<number, { status: "none" | "complete" | "incomplete"; remainingCount: number }>();
    for (let day = 1; day <= calDaysInMonth; day++) {
      const d = new Date(calYear, calMonth, day);
      const isFuture = d > today;
      if (isFuture) { statuses.set(day, { status: "none", remainingCount: 0 }); continue; }
      const dayDateStr = drillFormatDateStr(d);
      const dayScheduled = loadScheduledDrillIds(dayDateStr);
      const dayCompleted = loadCompletedDrills(dayDateStr);
      const dayKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const count = calSessionsByDate[dayKey]?.length || 0;
      const hasDrills = dayScheduled.size > 0 || count > 0;
      if (!hasDrills) { statuses.set(day, { status: "none", remainingCount: 0 }); continue; }
      const remainingCount = [...dayScheduled].filter(id => !dayCompleted.has(id)).length;
      const allDone = dayScheduled.size > 0 ? remainingCount === 0 : true;
      statuses.set(day, { status: allDone ? "complete" : "incomplete", remainingCount });
    }
    return statuses;
  }, [calYear, calMonth, calDaysInMonth, calSessionsByDate, refreshKey, calMounted]);

  const navigateCalendar = (dir: number) => {
    if (calViewMode === "week") {
      const newDate = new Date(calSelectedDate);
      newDate.setDate(newDate.getDate() + dir * 7);
      setCalSelectedDate(newDate);
      setCalMonth(newDate.getMonth());
      setCalYear(newDate.getFullYear());
    } else {
      let m = calMonth + dir, y = calYear;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      setCalMonth(m);
      setCalYear(y);
    }
  };

  // 스케줄 저장
  const handleSaveSchedule = useCallback(
    (ids: string[]) => {
      saveScheduledDrillIds(recDateStr, ids);

      // 캐리오버를 위해 스케줄된 드릴 정보를 날짜별 키에도 저장
      const latestCustomDrills = loadCustomDrills();
      const allDrills = [...dbDrillCards, ...latestCustomDrills];
      const drillsToSave = ids
        .map(id => allDrills.find(d => d.id === id))
        .filter(Boolean)
        .map(d => ({
          id: d!.id,
          song: d!.song,
          measures: d!.measures,
          title: d!.title,
          mode: "duration",
          duration: d!.duration || 0,
          recurrence: d!.recurrence || 0,
        }));
      if (drillsToSave.length > 0) {
        localStorage.setItem(`grit-on-drills-${recDateStr}`, JSON.stringify(drillsToSave));
      }

      // customDrills state 갱신 → TodayDrillList 리렌더
      const savedDrills = localStorage.getItem("grit-on-custom-drills");
      if (savedDrills) {
        setCustomDrills(JSON.parse(savedDrills));
      }

      setIsScheduleModalOpen(false);
      setRefreshKey((k) => k + 1);
    },
    [recDateStr]
  );

  // 오늘 연습한 시간 계산 (분)
  const todayPracticed = Math.floor(
    recentSessions
      .filter((s) => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime();
      })
      .reduce((sum, s) => sum + s.practiceTime, 0) / 60
  );

  const mockDrills = groupedDrills.flatMap(g => g.drills);
  const allDrills = [...mockDrills, ...customDrills.map(d => ({
    ...d,
    priority: "normal" as const,
    notes: "",
    mode: d.mode || "duration",
    recurrence: d.recurrence || 1,
    duration: d.duration || 0,
    tempo: 0,
  }))];
  // 기존 곡 목록 (중복 제거)
  const existingSongs = Array.from(new Set(allDrills.map(d => d.song)));
  const totalPlanMinutes = allDrills.reduce((sum, d) => sum + d.duration, 0);
  const completedMinutes = allDrills.filter(d => completedDrills.has(d.id)).reduce((sum, d) => sum + d.duration, 0);
  const planProgress = totalPlanMinutes > 0 ? (completedMinutes / totalPlanMinutes) * 100 : 0;

  return (
    <>
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shrink-0 hover:bg-white/50 transition-colors border border-white/40"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-black">
            {activeDrill ? "연습 준비 완료" : "연습 세션"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {hasPermission === false
              ? "마이크 권한이 필요합니다"
              : activeDrill
              ? "시작 버튼을 눌러 녹음과 AI 분석을 시작하세요"
              : "연습할 항목을 선택하거나 바로 시작하세요"}
          </p>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
      </div>

      {/* Auto-pause notification */}
      {autoPausedMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <MonitorOff className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">{autoPausedMessage}</p>
            <p className="text-xs text-amber-600 mt-1">
              다시 시작하려면 재생 버튼을 눌러주세요
            </p>
          </div>
          <button
            onClick={() => setAutoPausedMessage(null)}
            className="text-amber-400 hover:text-amber-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* AI 모델 로딩 상태 */}
      {modelStatus === "loading" && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-2 text-xs text-violet-700">
          <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          AI 분류 모델 준비 중...
        </div>
      )}
      {modelStatus === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-2 text-xs text-red-700">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          AI 모델 로드 실패 — 연습 시간 자동 측정이 제한됩니다
        </div>
      )}

      {/* Wake Lock Status (when recording) */}
      {isRecording && !isPaused && wakeLockSupported && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-2 text-xs text-green-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          화면 자동 꺼짐 방지 활성화됨
        </div>
      )}

      {/* Selected Song Card - 곡 선택 후 표시 */}
      {selectedSong && !activeDrill && !isRecording && (
        <div className="bg-gradient-to-r from-primary/5 to-violet-50 border border-primary/20 rounded-2xl p-4 mb-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-violet-600 rounded-xl flex items-center justify-center shrink-0">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{selectedSong.title}</p>
              {(selectedSong as any).composer && (
                <p className="text-sm text-gray-500 mt-0.5">{(selectedSong as any).composer}</p>
              )}
              <p className="text-xs text-primary mt-1">곡이 선택되었습니다. 시작 버튼을 누르세요</p>
            </div>
            <button
              onClick={() => setSelectedSong(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Active Drill Card - To-Do에서 선택한 연습 항목 */}
      {activeDrill && !isRecording && (
        <div className="bg-gradient-to-r from-violet-50 to-primary/5 border border-violet-200 rounded-2xl p-4 mb-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-primary rounded-xl flex items-center justify-center shrink-0">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{activeDrill.song}</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {activeDrill.measures} · {activeDrill.title}
              </p>
              {activeDrill.tempo > 0 && (
                <p className="text-xs text-violet-600 mt-1">
                  메트로놈 템포: ♩= {activeDrill.tempo}
                </p>
              )}
            </div>
            <button
              onClick={() => setActiveDrill(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 mb-3">
            아래 시작 버튼을 눌러 연습을 시작하세요
          </p>
        </div>
      )}

      {/* Timer Display with Controls & Metronome */}
      <PracticeTimer
        totalTime={totalTime}
        isRecording={isRecording}
        isPaused={isPaused}
        startTime={sessionStartTime}
        hasPermission={hasPermission}
        currentVolume={currentVolume}
        frequencyBands={frequencyBands}
        isCalibrating={isCalibrating}
        calibrationCountdown={calibrationCountdown}
        onStart={handleStartRecording}
        onPause={pauseRecording}
        onResume={handleResumeRecording}
        onStop={handleStopRecording}
        onRequestPermission={requestPermission}
        onMetronomeStateChange={handleMetronomeStateChange}
      />

      {/* Today's Drill List - 항상 표시 */}
      <TodayDrillList key={`drills-${customDrills.length}`} showPlayButton={!isRecording} onAddDrill={() => setIsAddDrillModalOpen(true)} onSessionSaved={reloadSessions} />



      {/* Hidden Audio Element */}
      {recordedAudio && (
        <audio
          ref={audioRef}
          src={recordedAudio.url}
          onEnded={handleAudioEnded}
        />
      )}

      {/* Practice Plan & Calendar Combined */}
      <div className="mt-8 space-y-4">
          {/* 연습 기록 - Calendar */}
          <div id="practice-records">
            <span className="inline-block font-bold text-sm text-violet-700 bg-violet-100 px-3.5 py-1 rounded-full mb-3">연습 기록</span>
            <div className="rounded-[20px] p-4" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 32px rgba(124,58,237,0.08)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-gray-900">{calYear}년 {calMonth + 1}월</span>
                  {calViewMode === "month" && calPracticeDays > 0 && (
                    <span className="flex items-center gap-1 text-sm text-violet-600 font-bold">
                      <Check className="w-4 h-4" />{calPracticeDays}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center bg-white/40 rounded-lg p-0.5 mr-1">
                    <button
                      onClick={() => { setCalViewMode("week"); setCalMonth(calSelectedDate.getMonth()); setCalYear(calSelectedDate.getFullYear()); }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${calViewMode === "week" ? "bg-violet-500 text-white shadow-sm" : "text-gray-400"}`}
                    >주</button>
                    <button
                      onClick={() => { setCalViewMode("month"); setCalMonth(calSelectedDate.getMonth()); setCalYear(calSelectedDate.getFullYear()); }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${calViewMode === "month" ? "bg-violet-500 text-white shadow-sm" : "text-gray-400"}`}
                    >월</button>
                  </div>
                  <button onClick={() => navigateCalendar(-1)} className="p-1.5 rounded-full hover:bg-white/30 transition-colors"><ChevronLeft className="w-4 h-4 text-gray-400" /></button>
                  <button onClick={() => navigateCalendar(1)} className="p-1.5 rounded-full hover:bg-white/30 transition-colors"><ChevronRight className="w-4 h-4 text-gray-400" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-0.5">
                {calDayNames.map((day, i) => (
                  <div key={day} className={`text-center text-[11px] font-medium py-0.5 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>{day}</div>
                ))}
              </div>

              {calViewMode === "week" ? (
                /* ── 주간 뷰 ── */
                <div className="grid grid-cols-7 gap-1">
                  {calWeekDays.map((d, i) => {
                    const day = d.getDate();
                    const dateStr = drillFormatDateStr(d);
                    const sessionKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const count = calSessionsByDate[sessionKey]?.length || 0;
                    const isToday = d.toDateString() === calToday.toDateString();
                    const todayMidnight = new Date(calToday.getFullYear(), calToday.getMonth(), calToday.getDate());
                    const isFuture = d.getTime() > todayMidnight.getTime();
                    const isSelected = d.toDateString() === calSelectedDate.toDateString();
                    const dow = d.getDay();
                    const weekInfo = calWeekStatuses.get(dateStr);
                    const dayStatus = weekInfo?.status || "none";
                    const hasSchedule = weekInfo?.hasSchedule || false;
                    const remainingCount = weekInfo?.remainingCount || 0;
                    const isOtherMonth = d.getMonth() !== calMonth;

                    const countStyle = isFuture && hasSchedule
                      ? "bg-violet-100/60 text-violet-400"
                      : isFuture
                      ? "bg-white/10 opacity-30"
                      : isToday && dayStatus === "complete"
                      ? "bg-violet-300 text-violet-700 shadow-lg shadow-violet-300/30"
                      : isToday && dayStatus === "incomplete"
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                      : isToday
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                      : dayStatus === "complete"
                      ? "bg-violet-200/60 text-violet-500"
                      : dayStatus === "incomplete"
                      ? "bg-violet-500/80 text-white"
                      : "bg-white/20 backdrop-blur-sm";

                    return (
                      <button key={i} onClick={() => { setCalSelectedDate(new Date(d)); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); }} className="flex flex-col items-center py-0.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${countStyle} ${isSelected && !isToday ? "ring-2 ring-violet-400 ring-offset-1 ring-offset-transparent" : ""}`}>
                          {dayStatus === "complete" ? "✓" : remainingCount > 0 ? remainingCount : count > 0 ? count : isFuture && hasSchedule ? "·" : ""}
                        </div>
                        <span className={`text-[9px] mt-0.5 ${isOtherMonth ? "text-gray-300" : dow === 0 ? "text-red-400" : dow === 6 ? "text-blue-400" : "text-gray-500"}`}>{day}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* ── 월간 뷰 ── */
                <div className="grid grid-cols-7 gap-1">
                  {Array(calFirstDay).fill(null).map((_, i) => (
                    <div key={`e-${i}`} className="flex flex-col items-center py-0.5"><div className="w-6 h-6" /><span className="text-[9px] h-3" /></div>
                  ))}
                  {Array(calDaysInMonth).fill(null).map((_, i) => {
                    const day = i + 1;
                    const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const count = calSessionsByDate[key]?.length || 0;
                    const isToday = day === calToday.getDate() && calMonth === calToday.getMonth() && calYear === calToday.getFullYear();
                    const isFuture = calYear > calToday.getFullYear() || (calYear === calToday.getFullYear() && calMonth > calToday.getMonth()) || (calYear === calToday.getFullYear() && calMonth === calToday.getMonth() && day > calToday.getDate());
                    const isSelected = day === calSelectedDate.getDate() && calMonth === calSelectedDate.getMonth() && calYear === calSelectedDate.getFullYear();
                    const dow = (calFirstDay + i) % 7;
                    const hasSchedule = scheduledDays.has(day);
                    const dayInfo = calDayStatuses.get(day);
                    const dayStatus = dayInfo?.status || "none";
                    const remainingCount = dayInfo?.remainingCount || 0;

                    const countStyle = isFuture && hasSchedule
                      ? "bg-violet-100/60 text-violet-400"
                      : isFuture
                      ? "bg-white/10 opacity-30"
                      : isToday && dayStatus === "complete"
                      ? "bg-violet-300 text-violet-700 shadow-lg shadow-violet-300/30"
                      : isToday && dayStatus === "incomplete"
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                      : isToday
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                      : dayStatus === "complete"
                      ? "bg-violet-200/60 text-violet-500"
                      : dayStatus === "incomplete"
                      ? "bg-violet-500/80 text-white"
                      : "bg-white/20 backdrop-blur-sm";

                    return (
                      <button key={day} onClick={() => { setCalSelectedDate(new Date(calYear, calMonth, day)); }} className="flex flex-col items-center py-0.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${countStyle} ${isSelected && !isToday ? "ring-2 ring-violet-400 ring-offset-1 ring-offset-transparent" : ""}`}>
                          {dayStatus === "complete" ? "✓" : remainingCount > 0 ? remainingCount : count > 0 ? count : isFuture && hasSchedule ? "·" : ""}
                        </div>
                        <span className={`text-[9px] mt-0.5 ${dow === 0 ? "text-red-400" : dow === 6 ? "text-blue-400" : "text-gray-500"}`}>{day}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-end gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-violet-200/60" />
                  <span className="text-[10px] text-gray-400">완료</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-violet-500/80" />
                  <span className="text-[10px] text-gray-400">미완료</span>
                </div>
              </div>

              {/* Selected Date Summary */}
              <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}>
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">{calSelectedDate.getMonth() + 1}월 {calSelectedDate.getDate()}일 {calWeekdayNames[calSelectedDate.getDay()]}</h3>
                  <p className="text-[11px] text-gray-400/80 mt-0.5">
                    {recSessions.length > 0
                      ? `${recSessions.length}개 연습${recTotalRecordings > 0 ? ` · ${recTotalRecordings}개 녹음` : ""}`
                      : "연습 기록이 없습니다"}
                  </p>
                </div>
              </div>

          {/* ─── SESSION TIMELINE (체크리스트 대신 타임라인만 표시) ─── */}
          {recSessions.length > 0 ? (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}>
              <span className="text-[13px] font-bold text-gray-900 block mb-3">
                연습 타임라인
              </span>
              <div className="ml-2 relative">
                <div
                  className="absolute left-[3px] top-2 bottom-2"
                  style={{ borderLeft: "2px solid rgba(167,139,250,0.3)" }}
                />
                {recSessions.map((session) => (
                  <PlayableTimelineSession key={session.id} session={session} />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center py-4">
              <p className="text-[12px] text-gray-400 mb-2">이 날은 연습 기록이 없습니다</p>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 text-white text-[13px] font-medium hover:bg-violet-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                연습 일정 추가
              </button>
            </div>
          )}

          {/* 미완료 연습 목록 */}
          {selectedDateIncompleteDrills.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[13px] font-bold text-gray-900">미완료 연습</span>
                <span className="text-[10px] text-white bg-violet-500 px-1.5 py-0.5 rounded-full font-semibold">
                  {selectedDateIncompleteDrills.length}
                </span>
              </div>
              <div className="space-y-2">
                {selectedDateIncompleteDrills.map((drill) => (
                  <div key={drill.id} className="flex items-center gap-3 bg-violet-50/60 rounded-xl px-3 py-2.5">
                    <div className="w-5 h-5 rounded-full border-2 border-violet-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{drill.song}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {drill.measures && `${drill.measures}`}
                        {drill.title && drill.title !== "연습" && ` · ${drill.title}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>

          {/* Carry-over Drills from Yesterday */}
          {carryOverDrills.length > 0 && showCarryOver && (
            <div className="bg-amber-50/60 backdrop-blur-xl rounded-3xl p-4 border border-amber-200/60 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-800 text-sm">어제 못 끝낸 연습</span>
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  {carryOverDrills.length}개
                </span>
              </div>
              <div className="space-y-2 mb-3">
                {carryOverDrills.map((drill) => (
                  <div key={drill.id} className="bg-white rounded-lg px-3 py-2 text-sm text-gray-700">
                    <span className="font-medium">{drill.song}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span>{drill.measures}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptCarryOver}
                  className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                >
                  <ArrowRight className="w-4 h-4" />
                  오늘 추가하기
                </button>
                <button
                  onClick={handleDismissCarryOver}
                  className="px-4 py-2 bg-white text-gray-500 rounded-lg text-sm border border-gray-200"
                >
                  무시
                </button>
              </div>
            </div>
          )}

          {/* Routines Section */}
          {routines.length > 0 && (
            <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-4 border border-white/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-violet-600" />
                  <span className="font-semibold text-black text-sm">나의 루틴</span>
                </div>
                <button
                  onClick={() => setIsRoutineModalOpen(true)}
                  className="text-xs text-gray-500 hover:text-black"
                >
                  + 새 루틴
                </button>
              </div>
              <div className="space-y-2">
                {routines.map((routine) => {
                  const isForToday = routine.days.length === 0 || routine.days.includes(new Date().getDay());
                  return (
                    <div
                      key={routine.id}
                      className={`rounded-xl border overflow-hidden ${
                        isForToday ? "border-violet-200 bg-violet-50" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="px-3 py-2.5 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black">{routine.name}</p>
                          <p className="text-xs text-gray-500">
                            {routine.drills.length}개 항목
                            {routine.days.length > 0 && (
                              <span className="ml-1">
                                · {routine.days.map(d => dayNames[d]).join(", ")}
                              </span>
                            )}
                            {routine.days.length === 0 && " · 매일"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {isForToday && (
                            <button
                              onClick={() => handleApplyRoutine(routine)}
                              className="px-2.5 py-1 bg-violet-600 text-white rounded-lg text-xs font-medium"
                            >
                              적용
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRoutine(routine.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-100 group"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

    </div>

      {/* Modals - bg-blob-violet 바깥에 렌더링 (position: relative 간섭 방지) */}
      <SongSelectionModal
        isOpen={isSongModalOpen}
        onClose={() => setIsSongModalOpen(false)}
        songs={songs}
        selectedSong={selectedSong}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectSong={handleSelectSong}
        onAddSongClick={() => setIsAddSongModalOpen(true)}
      />

      <AddSongModal
        isOpen={isAddSongModalOpen}
        onClose={() => setIsAddSongModalOpen(false)}
        newSong={newSong}
        onNewSongChange={setNewSong}
        onAddSong={handleAddSong}
      />

      {/* Practice Analysis Modal */}
      <PracticeAnalysisModal
        isOpen={isAnalysisModalOpen}
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
        analysisResult={analysisResult}
        audioUrl={recordedAudio?.url}
        dailyGoal={dailyGoal}
        songName={selectedSong?.title}
        todoNote={selectedTodo
          ? selectedTodo.measureStart > 0 && selectedTodo.measureEnd > 0
            ? `${selectedTodo.measureStart}-${selectedTodo.measureEnd}마디${selectedTodo.note ? ` · ${selectedTodo.note}` : ""}`
            : selectedTodo.note || undefined
          : undefined}
        onClose={handleCloseAnalysisModal}
        onSave={handleSaveAnalysis}
        onDiscard={handleDiscardAnalysis}
      />

      {/* Add Drill Modal */}
      {isAddDrillModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">연습 항목 추가</h3>
              <button
                onClick={() => {
                  setIsAddDrillModalOpen(false);
                  setNewDrill({ selectedSong: "", isNewSong: false, composer: "", songTitle: "", measures: "", title: "", mode: "duration", duration: 5, recurrence: 3 });
                }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="space-y-3">
              {/* 곡 선택 */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">곡 선택</label>

                {/* 기존 곡 목록 */}
                {existingSongs.length > 0 && !newDrill.isNewSong && (
                  <div className="space-y-1.5 mb-3">
                    {existingSongs.map((song) => (
                      <button
                        key={song}
                        onClick={() => setNewDrill({ ...newDrill, selectedSong: song, isNewSong: false })}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          newDrill.selectedSong === song
                            ? "bg-black text-white"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {song}
                      </button>
                    ))}
                  </div>
                )}

                {/* 새 곡 추가 버튼 / 입력 필드 */}
                {!newDrill.isNewSong ? (
                  <button
                    onClick={() => setNewDrill({ ...newDrill, isNewSong: true, selectedSong: "" })}
                    className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    새 곡 추가
                  </button>
                ) : (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">새 곡 정보</span>
                      <button
                        onClick={() => setNewDrill({ ...newDrill, isNewSong: false, composer: "", songTitle: "" })}
                        className="text-xs text-gray-500 hover:text-black"
                      >
                        취소
                      </button>
                    </div>
                    <ComposerAutocomplete
                      value={newDrill.composer}
                      onChange={(v) => setNewDrill({ ...newDrill, composer: v })}
                      placeholder="작곡가 (2글자 이상)"
                      autoFocus
                    />
                    <TitleAutocomplete
                      value={newDrill.songTitle}
                      onChange={(v) => setNewDrill({ ...newDrill, songTitle: v })}
                      composer={newDrill.composer}
                      placeholder="곡 이름 (2글자 이상)"
                    />
                  </div>
                )}
              </div>

              {/* 마디 구간 */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">마디 구간</label>
                <input
                  type="text"
                  value={newDrill.measures}
                  onChange={(e) => setNewDrill({ ...newDrill, measures: e.target.value })}
                  placeholder="예: 23-26마디"
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* 연습 내용 */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">연습 내용 (선택)</label>
                <input
                  type="text"
                  value={newDrill.title}
                  onChange={(e) => setNewDrill({ ...newDrill, title: e.target.value })}
                  placeholder="예: 왼손만 따로 tempo 120"
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Mode Toggle */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">연습 목표</label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setNewDrill({ ...newDrill, mode: "duration" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newDrill.mode === "duration"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    시간 (분)
                  </button>
                  <button
                    onClick={() => setNewDrill({ ...newDrill, mode: "recurrence" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newDrill.mode === "recurrence"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    횟수 (회)
                  </button>
                </div>

                {/* Value Input */}
                {newDrill.mode === "duration" ? (
                  <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg py-3">
                    <button
                      onClick={() => setNewDrill({ ...newDrill, duration: Math.max(1, newDrill.duration - 1) })}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg font-medium"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-black w-16 text-center">{newDrill.duration}</span>
                    <span className="text-gray-500">분</span>
                    <button
                      onClick={() => setNewDrill({ ...newDrill, duration: Math.min(60, newDrill.duration + 1) })}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg font-medium"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg py-3">
                    <button
                      onClick={() => setNewDrill({ ...newDrill, recurrence: Math.max(1, newDrill.recurrence - 1) })}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg font-medium"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-black w-16 text-center">{newDrill.recurrence}</span>
                    <span className="text-gray-500">회</span>
                    <button
                      onClick={() => setNewDrill({ ...newDrill, recurrence: Math.min(20, newDrill.recurrence + 1) })}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg font-medium"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAddDrill}
              disabled={
                (!newDrill.isNewSong && !newDrill.selectedSong) ||
                (newDrill.isNewSong && !newDrill.composer.trim() && !newDrill.songTitle.trim()) ||
                !newDrill.measures.trim()
              }
              className="w-full mt-4 py-3 bg-black text-white rounded-xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              추가하기
            </button>
          </div>
        </div>
      )}

      {/* Routine Modal */}
      {isRoutineModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">루틴 만들기</h3>
              <button
                onClick={() => {
                  setIsRoutineModalOpen(false);
                  setNewRoutine({ name: "", days: [], drills: [] });
                  setRoutineDrill({
                    selectedSong: "",
                    isNewSong: false,
                    composer: "",
                    songTitle: "",
                    measures: "",
                    title: "",
                    mode: "duration",
                    duration: 5,
                    recurrence: 3,
                  });
                }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Routine Name */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">루틴 이름</label>
                <input
                  type="text"
                  value={newRoutine.name}
                  onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                  placeholder="예: 아침 기초 연습"
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Days Selection */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">반복 요일 (선택 안하면 매일)</label>
                <div className="flex gap-1.5">
                  {dayNames.map((name, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleRoutineDay(idx)}
                      className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                        newRoutine.days.includes(idx)
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drills in Routine */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">
                  연습 항목 ({newRoutine.drills.length}개)
                </label>

                {newRoutine.drills.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {newRoutine.drills.map((drill, idx) => (
                      <div
                        key={drill.id}
                        className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-xs text-gray-400 w-4">{idx + 1}</span>
                        <div className="flex-1 text-sm">
                          <span className="font-medium text-black">{drill.song}</span>
                          <span className="text-gray-400 mx-1">·</span>
                          <span className="text-gray-600">{drill.measures}</span>
                        </div>
                        <button
                          onClick={() => {
                            setNewRoutine(prev => ({
                              ...prev,
                              drills: prev.drills.filter((_, i) => i !== idx),
                            }));
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-100"
                        >
                          <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add drill to routine */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  {/* Song Selection for Routine */}
                  {!routineDrill.isNewSong ? (
                    <div className="space-y-1.5">
                      {existingSongs.slice(0, 3).map((song) => (
                        <button
                          key={song}
                          onClick={() => setRoutineDrill({ ...routineDrill, selectedSong: song })}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                            routineDrill.selectedSong === song
                              ? "bg-black text-white"
                              : "bg-white text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {song}
                        </button>
                      ))}
                      <button
                        onClick={() => setRoutineDrill({ ...routineDrill, isNewSong: true, selectedSong: "" })}
                        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-black hover:text-black flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        다른 곡
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">새 곡</span>
                        <button
                          onClick={() => setRoutineDrill({ ...routineDrill, isNewSong: false, composer: "", songTitle: "" })}
                          className="text-xs text-gray-500"
                        >
                          취소
                        </button>
                      </div>
                      <ComposerAutocomplete
                        value={routineDrill.composer}
                        onChange={(v) => setRoutineDrill({ ...routineDrill, composer: v })}
                        placeholder="작곡가"
                      />
                      <TitleAutocomplete
                        value={routineDrill.songTitle}
                        onChange={(v) => setRoutineDrill({ ...routineDrill, songTitle: v })}
                        composer={routineDrill.composer}
                        placeholder="곡명"
                      />
                    </div>
                  )}

                  <input
                    type="text"
                    value={routineDrill.measures}
                    onChange={(e) => setRoutineDrill({ ...routineDrill, measures: e.target.value })}
                    placeholder="마디 구간 (예: 1-16마디)"
                    className="w-full px-3 py-2 bg-white rounded-lg text-xs border border-gray-200"
                  />

                  <div className="flex gap-2">
                    <select
                      value={routineDrill.mode}
                      onChange={(e) => setRoutineDrill({ ...routineDrill, mode: e.target.value as "duration" | "recurrence" })}
                      className="flex-1 px-3 py-2 bg-white rounded-lg text-xs border border-gray-200"
                    >
                      <option value="duration">시간 (분)</option>
                      <option value="recurrence">횟수 (회)</option>
                    </select>
                    <input
                      type="number"
                      value={routineDrill.mode === "duration" ? routineDrill.duration : routineDrill.recurrence}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        if (routineDrill.mode === "duration") {
                          setRoutineDrill({ ...routineDrill, duration: val });
                        } else {
                          setRoutineDrill({ ...routineDrill, recurrence: val });
                        }
                      }}
                      className="w-20 px-3 py-2 bg-white rounded-lg text-xs border border-gray-200 text-center"
                      min={1}
                    />
                  </div>

                  <button
                    onClick={handleAddRoutineDrill}
                    disabled={
                      (!routineDrill.isNewSong && !routineDrill.selectedSong) ||
                      (routineDrill.isNewSong && !routineDrill.composer.trim() && !routineDrill.songTitle.trim()) ||
                      !routineDrill.measures.trim()
                    }
                    className="w-full py-2 bg-violet-600 text-white rounded-lg text-xs font-medium disabled:opacity-30"
                  >
                    항목 추가
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveRoutine}
              disabled={!newRoutine.name.trim() || newRoutine.drills.length === 0}
              className="w-full mt-4 py-3 bg-black text-white rounded-xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              루틴 저장
            </button>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <ScheduleModal
          dateStr={recDateStr}
          dateLabel={`${calSelectedDate.getMonth() + 1}월 ${calSelectedDate.getDate()}일 ${calWeekdayNames[calSelectedDate.getDay()]}`}
          onClose={() => setIsScheduleModalOpen(false)}
          onSave={handleSaveSchedule}
        />
      )}
    </>
  );
}
