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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    decibelThreshold: 40, // 낮은 임계값으로 민감하게 감지
    minSoundDuration: 100,
    calibrationDuration: 800, // 빠른 캘리브레이션
  });

  useEffect(() => {
    setTip(getRandomTip());
  }, []);

  useEffect(() => {
    if (hasPermission === null) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleStartRecording = useCallback(async () => {
    setSessionStartTime(new Date());
    await startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    stopRecording();

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

      // 녹음된 오디오 URL 생성
      if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio({ url: audioUrl, duration: practiceTime });
      }
    }

    setCompletedSession({ totalTime, practiceTime, practiceType });
    setIsCompleteModalOpen(true);
  }, [
    stopRecording,
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
        onResume={resumeRecording}
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
