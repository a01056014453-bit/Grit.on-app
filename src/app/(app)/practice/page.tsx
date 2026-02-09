"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAudioRecorder } from "@/hooks";
import { savePracticeSession } from "@/lib/db";
import { mockSongs as initialSongs, getRandomTip, recentRecordings } from "@/data";
import type { PracticeType, Song } from "@/types";
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
}

interface RecordedAudio {
  url: string;
  duration: number;
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  useEffect(() => {
    setTip(getRandomTip());
    // Check if Wake Lock API is supported
    setWakeLockSupported("wakeLock" in navigator);
  }, []);

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
      } catch (err) {
        console.error("Failed to save session:", err);
      }

      if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio({ url: audioUrl, duration: practiceTime });
      }
    }

    setCompletedSession({ totalTime, practiceTime, practiceType });
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

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-foreground">연습 세션</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {hasPermission === false
            ? "마이크 권한이 필요합니다"
            : "녹음 버튼을 눌러 연습을 시작하세요"}
        </p>
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
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

      {/* Recent Recordings Section */}
      {!isRecording && (
        <RecentRecordingsList recordings={recentRecordings} />
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
    </div>
  );
}
