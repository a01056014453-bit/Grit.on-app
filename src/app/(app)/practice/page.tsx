"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAudioRecorder } from "@/hooks";
import { savePracticeSession, getAllSessions, type PracticeSession } from "@/lib/db";
import { mockSongs as initialSongs, getRandomTip, mockDrillCards, hasAIAnalysis, groupDrillsBySong, composerList } from "@/data";
import type { PracticeType, Song } from "@/types";
import Link from "next/link";
import { Music2, ChevronRight, Plus, Check, X, Clock, RotateCcw, Repeat, ArrowRight, Trash2 } from "lucide-react";
import {
  PieceSelector,
  PracticeTimer,
  PracticeControls,
  RecentRecordingsList,
  SongSelectionModal,
  AddSongModal,
  PracticeCompleteModal,
  AIAnalysisConsentModal,
} from "@/components/practice";
import { AlertCircle, MonitorOff } from "lucide-react";

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

export default function PracticePage() {
  const router = useRouter();
  const [tip, setTip] = useState("");
  const [selectedSong, setSelectedSong] = useState<Song>(initialSongs[0]);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isAIAnalysisModalOpen, setIsAIAnalysisModalOpen] = useState(false);
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [practiceType, setPracticeType] = useState<PracticeType>("runthrough");
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [searchQuery, setSearchQuery] = useState("");
  const [newSong, setNewSong] = useState({ composer: "", title: "" });
  const [completedSession, setCompletedSession] = useState<CompletedSession | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPausedMessage, setAutoPausedMessage] = useState<string | null>(null);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);
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

  const groupedDrills = groupDrillsBySong(mockDrillCards);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const wasRecordingBeforeHiddenRef = useRef(false);

  // Audio recorder hook
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
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
  } = useAudioRecorder({
    decibelThreshold: 40,
    minSoundDuration: 100,
    calibrationDuration: 800,
  });

  const loadRecentSessions = useCallback(async () => {
    try {
      const sessions = await getAllSessions();
      // Sort by startTime descending (most recent first)
      const sorted = sessions.sort((a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      setRecentSessions(sorted);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  }, []);

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
    setTip(getRandomTip());
    // Check if Wake Lock API is supported
    setWakeLockSupported("wakeLock" in navigator);
    // Load recent sessions
    loadRecentSessions();

    // Load custom drills from localStorage
    const savedDrills = localStorage.getItem("grit-on-custom-drills");
    if (savedDrills) {
      setCustomDrills(JSON.parse(savedDrills));
    }

    // Load routines
    const savedRoutines = localStorage.getItem("grit-on-routines");
    if (savedRoutines) {
      setRoutines(JSON.parse(savedRoutines));
    }

    // Load today's completed drills
    const todayStr = getTodayStr();
    const todayCompletion = localStorage.getItem(`grit-on-completed-${todayStr}`);
    if (todayCompletion) {
      const data = JSON.parse(todayCompletion);
      setCompletedDrills(new Set(data.completedDrillIds || []));
    }

    // Check for carry-over drills from yesterday
    const yesterdayStr = getYesterdayStr();
    const yesterdayCompletion = localStorage.getItem(`grit-on-completed-${yesterdayStr}`);
    const yesterdayDrills = localStorage.getItem(`grit-on-drills-${yesterdayStr}`);

    if (yesterdayDrills) {
      const allYesterdayDrills: Drill[] = JSON.parse(yesterdayDrills);
      const completedIds = yesterdayCompletion
        ? new Set(JSON.parse(yesterdayCompletion).completedDrillIds || [])
        : new Set();

      const incomplete = allYesterdayDrills.filter(d => !completedIds.has(d.id));
      if (incomplete.length > 0) {
        // Check if user already dismissed carry-over for today
        const dismissedCarryOver = localStorage.getItem(`grit-on-carryover-dismissed-${todayStr}`);
        if (!dismissedCarryOver) {
          setCarryOverDrills(incomplete);
        }
      }
    }
  }, [loadRecentSessions]);

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
    setSessionStartTime(new Date());
    setAutoPausedMessage(null);
    await startRecording();
  }, [startRecording]);

  const handleResumeRecording = useCallback(() => {
    setAutoPausedMessage(null);
    wasRecordingBeforeHiddenRef.current = false;
    resumeRecording();
  }, [resumeRecording]);

  const handleStopRecording = useCallback(async () => {
    stopRecording();
    releaseWakeLock();

    if (sessionStartTime) {
      const session = {
        pieceId: selectedSong.id,
        pieceName: selectedSong.title,
        startTime: sessionStartTime,
        endTime: new Date(),
        totalTime,
        practiceTime,
        audioBlob: audioBlob || undefined,
        synced: false,
        practiceType,
        label: "연습",
      };

      try {
        await savePracticeSession(session);
        await loadRecentSessions();
      } catch (err) {
        console.error("Failed to save session:", err);
      }

      if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio({ url: audioUrl, duration: practiceTime });
      }
    }

    setCompletedSession({
      totalTime,
      practiceTime,
      practiceType,
      startTime: sessionStartTime || undefined,
      endTime: new Date(),
    });
    setIsCompleteModalOpen(true);
    setAutoPausedMessage(null);
  }, [
    stopRecording,
    releaseWakeLock,
    sessionStartTime,
    selectedSong,
    totalTime,
    practiceTime,
    audioBlob,
    practiceType,
    loadRecentSessions,
  ]);

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

  const handleCloseCompleteModal = () => {
    setIsCompleteModalOpen(false);
    setCompletedSession(null);
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url);
      setRecordedAudio(null);
    }
    setIsPlaying(false);
    reset();
  };

  const handleViewRecording = () => {
    setIsCompleteModalOpen(false);
    router.push("/recordings/1");
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setIsSongModalOpen(false);
  };

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
      localStorage.setItem(`grit-on-completed-${todayStr}`, JSON.stringify({
        date: todayStr,
        completedDrillIds: Array.from(newSet),
      }));
      return newSet;
    });
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
    setNewRoutine({ name: "", days: [], drills: [] });
    setIsRoutineModalOpen(false);
  };

  // Delete routine
  const handleDeleteRoutine = (routineId: string) => {
    const updatedRoutines = routines.filter(r => r.id !== routineId);
    setRoutines(updatedRoutines);
    localStorage.setItem("grit-on-routines", JSON.stringify(updatedRoutines));
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

  // Composer autocomplete
  const filteredComposers = newDrill.composer.length >= 2
    ? composerList.filter((c) =>
        c.label.toLowerCase().includes(newDrill.composer.toLowerCase()) ||
        c.key.includes(newDrill.composer.toLowerCase())
      )
    : [];

  // Song title autocomplete - filter by selected composer or show all matching songs
  const filteredSongSuggestions = newDrill.songTitle.length >= 2
    ? initialSongs.filter((s) => {
        const matchesTitle = s.title.toLowerCase().includes(newDrill.songTitle.toLowerCase());
        const matchesComposer = newDrill.composer
          ? s.title.toLowerCase().includes(newDrill.composer.toLowerCase())
          : true;
        return matchesTitle && matchesComposer;
      })
    : [];

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
    setNewDrill({ selectedSong: "", isNewSong: false, composer: "", songTitle: "", measures: "", title: "", mode: "duration", duration: 5, recurrence: 3 });
    setIsAddDrillModalOpen(false);
  };

  // Delete custom drill
  const handleDeleteDrill = (drillId: string) => {
    const updatedDrills = customDrills.filter(d => d.id !== drillId);
    setCustomDrills(updatedDrills);
    localStorage.setItem("grit-on-custom-drills", JSON.stringify(updatedDrills));
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
    <div className="px-4 py-6 max-w-lg mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-black">연습 세션</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {hasPermission === false
            ? "마이크 권한이 필요합니다"
            : "녹음 버튼을 눌러 연습을 시작하세요"}
        </p>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
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

      {/* Wake Lock Status (when recording) */}
      {isRecording && !isPaused && wakeLockSupported && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-2 text-xs text-green-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          화면 자동 꺼짐 방지 활성화됨
        </div>
      )}

      {/* Piece Selection */}
      <PieceSelector
        selectedSong={selectedSong}
        isRecording={isRecording}
        onClick={() => setIsSongModalOpen(true)}
      />

      {/* Timer Display */}
      <PracticeTimer
        practiceTime={practiceTime}
        isRecording={isRecording}
        isPaused={isPaused}
        tip={tip}
        recordedAudio={recordedAudio}
        isPlaying={isPlaying}
        onPlayRecording={handlePlayRecording}
        startTime={sessionStartTime}
      />

      {/* Debug: Sound Detection Status */}
      {isRecording && (
        <div className="bg-gray-100 rounded-lg p-3 mb-4 text-xs font-mono">
          <div className="flex justify-between items-center mb-2">
            <span>현재 음량:</span>
            <span className={`font-bold ${isPianoDetected ? 'text-green-600' : 'text-gray-600'}`}>
              {currentDecibel} dB
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>기준 소음:</span>
            <span>{noiseFloor} dB</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>상태:</span>
            <span className={isPianoDetected ? 'text-green-600 font-bold' : 'text-gray-500'}>
              {isCalibrating ? '측정 중...' : isPianoDetected ? '🎹 연습 감지!' : '대기 중'}
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all ${isPianoDetected ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, (currentDecibel / 100) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      {recordedAudio && (
        <audio
          ref={audioRef}
          src={recordedAudio.url}
          onEnded={handleAudioEnded}
        />
      )}

      {/* Controls */}
      <PracticeControls
        isRecording={isRecording}
        isPaused={isPaused}
        hasPermission={hasPermission}
        onStart={handleStartRecording}
        onPause={pauseRecording}
        onResume={handleResumeRecording}
        onStop={handleStopRecording}
        onRequestPermission={requestPermission}
      />

      {/* Practice Plan & Calendar Combined */}
      {!isRecording && (
        <div className="mt-8 space-y-4">
          {/* Weekly Overview - Compact */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-black text-sm">이번 주 연습</span>
              <Link href="/goals" className="text-xs text-gray-500 flex items-center gap-1">
                전체 보기
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weeklyData.map((day, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-[10px] text-gray-400 mb-1">{day.name}</p>
                  <div
                    className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-xs font-semibold ${
                      day.isToday
                        ? "bg-black text-white"
                        : day.minutes > 0
                        ? "bg-violet-100 text-violet-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {day.minutes > 0 ? `${day.minutes}` : "-"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carry-over Drills from Yesterday */}
          {carryOverDrills.length > 0 && showCarryOver && (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
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
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
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

          {/* Today's Plan with Progress */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-black">오늘의 연습</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {completedDrills.size}/{allDrills.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {routines.length === 0 && (
                  <button
                    onClick={() => setIsRoutineModalOpen(true)}
                    className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center hover:bg-violet-200 transition-colors"
                    title="루틴 만들기"
                  >
                    <Repeat className="w-4 h-4 text-violet-600" />
                  </button>
                )}
                <button
                  onClick={() => setIsAddDrillModalOpen(true)}
                  className="w-7 h-7 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-black to-violet-500 rounded-full transition-all"
                style={{ width: `${planProgress}%` }}
              />
            </div>

            {/* Drill List - Grouped by Song */}
            {allDrills.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  // Group drills by song name
                  const groupedBySong: Record<string, typeof allDrills> = {};
                  allDrills.forEach((drill) => {
                    if (!groupedBySong[drill.song]) {
                      groupedBySong[drill.song] = [];
                    }
                    groupedBySong[drill.song].push(drill);
                  });

                  return Object.entries(groupedBySong).map(([songName, drills]) => (
                    <div key={songName} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Song Header */}
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <p className="text-sm font-semibold text-black">{songName}</p>
                      </div>
                      {/* Drills under this song */}
                      <div className="divide-y divide-gray-100">
                        {drills.map((drill) => {
                          const isCompleted = completedDrills.has(drill.id);
                          const isCustom = drill.id.startsWith("custom-");
                          const displayInfo = isCustom
                            ? ((drill as typeof customDrills[0]).mode === "recurrence"
                                ? `${drill.recurrence}회`
                                : `${drill.duration}분`)
                            : `템포 ${drill.tempo} ${drill.recurrence}회`;

                          return (
                            <div
                              key={drill.id}
                              className={`px-4 py-2.5 flex items-center gap-3 ${
                                isCompleted ? "bg-gray-50" : "bg-white"
                              }`}
                            >
                              <button
                                onClick={() => handleToggleDrill(drill.id)}
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isCompleted
                                    ? "bg-green-500 border-green-500"
                                    : "border-gray-300 hover:border-gray-400"
                                }`}
                              >
                                {isCompleted && <Check className="w-2.5 h-2.5 text-white" />}
                              </button>
                              <p className={`flex-1 text-xs ${isCompleted ? "text-gray-400 line-through" : "text-gray-600"}`}>
                                {drill.measures} · {drill.title} {displayInfo}
                              </p>
                              {isCustom && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDrill(drill.id);
                                  }}
                                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-100 group"
                                >
                                  <X className="w-3 h-3 text-gray-400 group-hover:text-red-500" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-2">연습 플랜이 없습니다</p>
                <Link
                  href="/analysis"
                  className="inline-block px-4 py-2 bg-black text-white text-sm font-medium rounded-lg"
                >
                  AI 분석하기
                </Link>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <RecentRecordingsList sessions={recentSessions} />
        </div>
      )}

      {/* Modals */}
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

      <PracticeCompleteModal
        isOpen={isCompleteModalOpen}
        onClose={handleCloseCompleteModal}
        selectedSong={selectedSong}
        completedSession={completedSession}
        onViewRecording={handleViewRecording}
      />

      <AIAnalysisConsentModal
        isOpen={isAIAnalysisModalOpen}
        onClose={() => {
          setIsAIAnalysisModalOpen(false);
          setIsCompleteModalOpen(true);
        }}
        onStartAnalysis={() => {
          setIsAIAnalysisModalOpen(false);
          router.push("/analysis");
        }}
        onSkip={() => {
          setIsAIAnalysisModalOpen(false);
          setIsCompleteModalOpen(true);
        }}
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
                    <input
                      type="text"
                      value={newDrill.composer}
                      onChange={(e) => setNewDrill({ ...newDrill, composer: e.target.value })}
                      placeholder="작곡가 (2글자 이상)"
                      className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
                      autoFocus
                    />
                    {filteredComposers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {filteredComposers.slice(0, 4).map((c) => (
                          <button
                            key={c.key}
                            onClick={() => setNewDrill({ ...newDrill, composer: c.label })}
                            className={`text-xs px-2 py-1 rounded-full transition-colors ${
                              newDrill.composer === c.label
                                ? "bg-black text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      value={newDrill.songTitle}
                      onChange={(e) => setNewDrill({ ...newDrill, songTitle: e.target.value })}
                      placeholder="곡 이름 (2글자 이상)"
                      className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    {filteredSongSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {filteredSongSuggestions.slice(0, 3).map((s) => {
                          const parts = s.title.split(" ");
                          const songOnly = parts.slice(2).join(" ") || s.title;
                          const composerOnly = parts.slice(0, 2).join(" ");
                          return (
                            <button
                              key={s.id}
                              onClick={() => setNewDrill({ ...newDrill, composer: composerOnly, songTitle: songOnly })}
                              className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 truncate max-w-[150px]"
                            >
                              {s.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
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
                  placeholder="예: 양손 어긋남"
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
                      <input
                        type="text"
                        value={routineDrill.composer}
                        onChange={(e) => setRoutineDrill({ ...routineDrill, composer: e.target.value })}
                        placeholder="작곡가"
                        className="w-full px-3 py-2 bg-white rounded-lg text-xs border border-gray-200"
                      />
                      <input
                        type="text"
                        value={routineDrill.songTitle}
                        onChange={(e) => setRoutineDrill({ ...routineDrill, songTitle: e.target.value })}
                        placeholder="곡명"
                        className="w-full px-3 py-2 bg-white rounded-lg text-xs border border-gray-200"
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
    </div>
  );
}
