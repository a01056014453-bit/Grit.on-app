"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Square,
  Music,
  Clock,
  Sparkles,
  ChevronRight,
  Check,
  Trophy,
  TrendingUp,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useAudioRecorder } from "@/hooks";
import { savePracticeSession } from "@/lib/db";

// Mock songs library
const mockSongs = [
  {
    id: "1",
    title: "발라드 1번 G단조",
    composer: "F. Chopin",
    opus: "Op. 23",
    difficulty: "고급",
    duration: "9분",
    lastPracticed: "오늘",
  },
  {
    id: "2",
    title: "피아노 소나타 8번 '비창'",
    composer: "L. v. Beethoven",
    opus: "Op. 13",
    difficulty: "중급",
    duration: "18분",
    lastPracticed: "어제",
  },
  {
    id: "3",
    title: "달빛 (Clair de lune)",
    composer: "C. Debussy",
    opus: "Suite bergamasque",
    difficulty: "중급",
    duration: "5분",
    lastPracticed: "3일 전",
  },
  {
    id: "4",
    title: "라 캄파넬라",
    composer: "F. Liszt",
    opus: "S. 141",
    difficulty: "고급",
    duration: "5분",
    lastPracticed: "1주일 전",
  },
  {
    id: "5",
    title: "환상즉흥곡",
    composer: "F. Chopin",
    opus: "Op. 66",
    difficulty: "고급",
    duration: "5분",
    lastPracticed: "2주일 전",
  },
];

const PRACTICE_TIPS = [
  "천천히 연습하는 것이 가장 빠른 길입니다.",
  "어려운 부분은 리듬을 바꿔서 연습해보세요.",
  "한 손씩 따로 연습하면 더 명확해집니다.",
  "녹음해서 자신의 연주를 객관적으로 들어보세요.",
  "긴장을 풀고 호흡에 집중하세요.",
  "메트로놈을 활용하여 정확한 템포를 유지하세요.",
  "같은 구간을 5번 연속 완벽하게 치면 다음으로 넘어가세요.",
  "손목과 팔의 힘을 빼고 자연스럽게 연주하세요.",
  "어려운 패시지는 점점 빠르게 연습해보세요.",
  "눈을 감고 연주해보면 청각에 더 집중할 수 있어요.",
  "프레이징을 노래하듯이 연주해보세요.",
  "페달 없이 먼저 완벽하게 연습하세요.",
];

export default function PracticePage() {
  const router = useRouter();
  const [tip, setTip] = useState("");
  const [selectedSong, setSelectedSong] = useState(mockSongs[0]);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completedSession, setCompletedSession] = useState<{
    totalTime: number;
    practiceTime: number;
  } | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Audio recorder hook
  const {
    isRecording,
    isPaused,
    hasPermission,
    error,
    totalTime,
    practiceTime,
    currentVolume,
    isSoundDetected,
    audioBlob,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
  } = useAudioRecorder({
    volumeThreshold: 10, // 0-100, minimum volume to count as sound
    minSoundDuration: 300, // ms
  });

  useEffect(() => {
    setTip(PRACTICE_TIPS[Math.floor(Math.random() * PRACTICE_TIPS.length)]);
  }, []);

  // Request permission on mount
  useEffect(() => {
    if (hasPermission === null) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartRecording = useCallback(async () => {
    setSessionStartTime(new Date());
    await startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    stopRecording();

    // Save session to IndexedDB
    if (sessionStartTime) {
      const session = {
        pieceId: selectedSong.id,
        pieceName: selectedSong.title,
        composer: selectedSong.composer,
        startTime: sessionStartTime,
        endTime: new Date(),
        totalTime,
        practiceTime,
        audioBlob: audioBlob || undefined,
        synced: false,
      };

      try {
        await savePracticeSession(session);
      } catch (err) {
        console.error("Failed to save session:", err);
      }
    }

    setCompletedSession({ totalTime, practiceTime });
    setIsCompleteModalOpen(true);
  }, [
    stopRecording,
    sessionStartTime,
    selectedSong,
    totalTime,
    practiceTime,
    audioBlob,
  ]);

  const handleCloseCompleteModal = () => {
    setIsCompleteModalOpen(false);
    setCompletedSession(null);
    reset();
  };

  const handleViewRecording = () => {
    setIsCompleteModalOpen(false);
    router.push("/recordings/1");
  };

  const handleSelectSong = (song: (typeof mockSongs)[0]) => {
    setSelectedSong(song);
    setIsSongModalOpen(false);
  };

  // Generate waveform bars based on volume
  const generateWaveformBars = () => {
    const bars = [];
    const baseHeight = isSoundDetected ? 30 : 15;
    const volumeMultiplier = currentVolume / 100;

    for (let i = 0; i < 24; i++) {
      const randomFactor = 0.5 + Math.random() * 0.5;
      const height = isPaused
        ? 15
        : baseHeight + volumeMultiplier * 60 * randomFactor;
      bars.push(height);
    }
    return bars;
  };

  const waveformHeights = isRecording ? generateWaveformBars() : [];

  // Calculate practice ratio
  const practiceRatio =
    totalTime > 0 ? Math.round((practiceTime / totalTime) * 100) : 0;

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
      <div
        onClick={() => !isRecording && setIsSongModalOpen(true)}
        className={`bg-card rounded-xl p-4 border border-border shadow-sm mb-6 transition-transform cursor-pointer ${
          !isRecording ? "active:scale-[0.99]" : "opacity-60"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-card-foreground">
              {selectedSong.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedSong.composer} · {selectedSong.opus}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              {selectedSong.difficulty}
            </span>
            {!isRecording && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-card rounded-2xl p-8 border border-border shadow-sm mb-6 relative overflow-hidden">
        <div className="text-center relative z-10">
          {/* Main Timer - Practice Time */}
          <div className="text-6xl font-bold text-foreground font-mono mb-1 tracking-tighter">
            {formatTime(practiceTime)}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span>순연습시간</span>
            {isRecording && (
              <span
                className={`ml-2 flex items-center gap-1 ${
                  isSoundDetected ? "text-green-500" : "text-muted-foreground"
                }`}
              >
                {isSoundDetected ? (
                  <Volume2 className="w-3 h-3" />
                ) : (
                  <MicOff className="w-3 h-3" />
                )}
              </span>
            )}
          </div>

          {/* Secondary Timer - Total Time */}
          {isRecording && (
            <div className="text-sm text-muted-foreground mb-6">
              총 시간: {formatTime(totalTime)} ({practiceRatio}% 연습)
            </div>
          )}

          {/* Dynamic Content Area */}
          <div className="h-24 flex items-center justify-center">
            {isRecording ? (
              <div className="flex items-end gap-1.5 h-16 w-full justify-center px-4">
                {waveformHeights.map((height, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isSoundDetected ? "bg-green-500" : "bg-primary"
                    }`}
                    style={{
                      height: `${height}%`,
                      opacity: isPaused ? 0.3 : 0.6 + (height / 100) * 0.4,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-secondary rounded-xl p-4 w-full flex items-center gap-3 animate-fade-in">
                <div className="shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-sm text-muted-foreground font-medium text-left leading-snug text-pretty">
                  &quot;{tip}&quot;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Volume Meter */}
      {isRecording && !isPaused && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">입력 레벨</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                isSoundDetected
                  ? "bg-gradient-to-r from-green-400 to-green-500"
                  : "bg-gradient-to-r from-primary/50 to-primary"
              }`}
              style={{ width: `${currentVolume}%` }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          <Button
            onClick={handleStartRecording}
            disabled={hasPermission === false}
            className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            <Play className="w-8 h-8 text-white" fill="white" />
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => (isPaused ? resumeRecording() : pauseRecording())}
              className="w-16 h-16 rounded-full"
            >
              {isPaused ? (
                <Play className="w-6 h-6" fill="currentColor" />
              ) : (
                <Pause className="w-6 h-6" />
              )}
            </Button>
            <Button
              onClick={handleStopRecording}
              className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90"
            >
              <Square className="w-6 h-6 text-white" fill="white" />
            </Button>
          </>
        )}
      </div>

      {isRecording && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          {isPaused ? "일시정지됨" : "녹음 중..."}
        </p>
      )}

      {/* Permission Request Button */}
      {hasPermission === false && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={requestPermission}>
            <Mic className="w-4 h-4 mr-2" />
            마이크 권한 요청
          </Button>
        </div>
      )}

      {/* Song Selection Modal */}
      <Modal
        isOpen={isSongModalOpen}
        onClose={() => setIsSongModalOpen(false)}
        title="연습곡 선택"
      >
        <div className="p-4 space-y-2">
          {mockSongs.map((song) => (
            <button
              key={song.id}
              onClick={() => handleSelectSong(song)}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                selectedSong.id === song.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedSong.id === song.id ? "bg-primary/10" : "bg-secondary"
                  }`}
                >
                  <Music
                    className={`w-5 h-5 ${
                      selectedSong.id === song.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{song.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {song.composer} · {song.opus}
                  </p>
                </div>
                <div className="text-right">
                  {selectedSong.id === song.id ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {song.lastPracticed}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-13">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    song.difficulty === "고급"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {song.difficulty}
                </span>
                <span className="text-xs text-muted-foreground">
                  {song.duration}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Practice Complete Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={handleCloseCompleteModal}
        title=""
        showClose={false}
      >
        <div className="p-6 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-green-600" />
          </div>

          <h3 className="text-xl font-bold text-foreground mb-1">연습 완료!</h3>
          <p className="text-muted-foreground mb-6">
            오늘도 훌륭한 연습이었어요
          </p>

          {/* Stats */}
          <div className="bg-secondary rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Music className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">
                {selectedSong.title}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {completedSession ? formatTime(completedSession.totalTime) : "00:00"}
                </div>
                <div className="text-xs text-muted-foreground">총 시간</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {completedSession ? formatTime(completedSession.practiceTime) : "00:00"}
                </div>
                <div className="text-xs text-muted-foreground">순연습</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                  {completedSession && completedSession.totalTime > 0
                    ? Math.round(
                        (completedSession.practiceTime /
                          completedSession.totalTime) *
                          100
                      )
                    : 0}
                  %
                </div>
                <div className="text-xs text-muted-foreground">집중도</div>
              </div>
            </div>
          </div>

          {/* Encouragement based on practice ratio */}
          {completedSession && (
            <div className="bg-primary/5 rounded-xl p-3 mb-6">
              <p className="text-sm text-primary">
                {completedSession.totalTime > 0 &&
                completedSession.practiceTime / completedSession.totalTime >= 0.7
                  ? "🎉 훌륭해요! 집중력이 대단합니다!"
                  : completedSession.totalTime > 0 &&
                    completedSession.practiceTime / completedSession.totalTime >= 0.5
                  ? "👍 좋은 연습이었어요! 조금 더 집중해볼까요?"
                  : "💪 꾸준히 연습하면 더 좋아질 거예요!"}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleViewRecording}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              분석 결과 보기
            </button>
            <button
              onClick={handleCloseCompleteModal}
              className="w-full py-3 text-muted-foreground rounded-xl font-medium hover:bg-accent transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
